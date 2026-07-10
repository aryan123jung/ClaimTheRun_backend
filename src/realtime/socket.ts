import http from "http";
import jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import { JWT_SECRET } from "../configs/index.ts";

type AuthSocketPayload = {
  id: string;
  email: string;
};

type CallInvitePayload = {
  callId: string;
  callerId: string;
  callerName: string;
  callerAvatarUrl?: string | null;
  receiverId: string;
  isVideo: boolean;
  createdAt: string;
};

type CallSignalPayload = {
  callId: string;
  fromUserId: string;
  toUserId: string;
  data: Record<string, unknown>;
};

type MessageEventPayload = {
  id: string;
  conversationId: string;
  text: string;
  senderId: string;
  receiverId: string;
  createdAt: Date;
  isMine: boolean;
  isReadByOtherUser: boolean;
};

type GroupMessageEventPayload = {
  id: string;
  communityId: string;
  text: string;
  createdAt: Date;
  sender: {
    id: string;
    fullname: string;
    username: string;
    profileUrl?: string | null;
  };
  isMine: boolean;
};

type GroupVoiceParticipantPayload = {
  userId: string;
  name: string;
  avatarUrl?: string | null;
};

type GroupVoiceJoinPayload = {
  communityId: string;
  userId: string;
  name: string;
  avatarUrl?: string | null;
};

type GroupVoiceSignalPayload = {
  communityId: string;
  targetUserId: string;
  senderUserId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  data: Record<string, unknown>;
};

let io: Server | null = null;
const groupVoiceParticipants = new Map<
  string,
  Map<string, GroupVoiceParticipantPayload>
>();

export function initializeSocket(server: http.Server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH"],
    },
  });

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token?.toString() ??
        socket.handshake.headers.authorization
          ?.toString()
          .replace("Bearer ", "")
          .trim();

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as AuthSocketPayload;
      socket.data.user = { id: decoded.id, email: decoded.email };
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.user?.id?.toString?.();
    if (!userId) {
      socket.disconnect();
      return;
    }

    socket.join(`user:${userId}`);

    socket.on("conversation:join", (conversationId: string) => {
      if (
        typeof conversationId === "string" &&
        conversationId.trim().length > 0
      ) {
        socket.join(`conversation:${conversationId.trim()}`);
      }
    });

    socket.on("conversation:leave", (conversationId: string) => {
      if (
        typeof conversationId === "string" &&
        conversationId.trim().length > 0
      ) {
        socket.leave(`conversation:${conversationId.trim()}`);
      }
    });

    socket.on("group:join", (communityId: string) => {
      if (typeof communityId === "string" && communityId.trim().length > 0) {
        socket.join(`group:${communityId.trim()}`);
      }
    });

    socket.on("group:leave", (communityId: string) => {
      if (typeof communityId === "string" && communityId.trim().length > 0) {
        socket.leave(`group:${communityId.trim()}`);
      }
    });

    socket.on("group:voice:join", (payload: GroupVoiceJoinPayload) => {
      if (
        !payload?.communityId ||
        !payload?.userId ||
        payload.userId !== userId
      ) {
        return;
      }

      const communityId = payload.communityId.trim();
      const roomKey = `group-voice:${communityId}`;
      socket.join(roomKey);

      const participants =
        groupVoiceParticipants.get(communityId) ??
        new Map<string, GroupVoiceParticipantPayload>();
      const current = {
        userId,
        name: payload.name?.toString().trim() || "Runner",
        avatarUrl: payload.avatarUrl?.toString(),
      };
      const existingParticipants = Array.from(participants.values()).filter(
        (participant) => participant.userId !== userId,
      );

      participants.set(userId, current);
      groupVoiceParticipants.set(communityId, participants);

      socket.emit("group:voice:participants", {
        communityId,
        participants: existingParticipants,
      });
      socket.to(roomKey).emit("group:voice:user-joined", {
        communityId,
        participant: current,
      });
    });

    socket.on("group:voice:leave", (communityId: string) => {
      if (typeof communityId !== "string" || communityId.trim().length === 0) {
        return;
      }
      removeParticipantFromVoiceRoom(socket, communityId.trim(), userId);
    });

    socket.on("group:voice:signal", (payload: GroupVoiceSignalPayload) => {
      if (
        !payload?.communityId ||
        !payload?.targetUserId ||
        !payload?.senderUserId ||
        payload.senderUserId !== userId
      ) {
        return;
      }

      io?.to(`user:${payload.targetUserId}`).emit("group:voice:signal", {
        communityId: payload.communityId,
        senderUserId: payload.senderUserId,
        senderName: payload.senderName,
        senderAvatarUrl: payload.senderAvatarUrl,
        data: payload.data,
      });
    });

    socket.on("call:invite", (payload: CallInvitePayload) => {
      if (!payload?.receiverId || payload.receiverId === userId) return;
      io?.to(`user:${payload.receiverId}`).emit("call:incoming", payload);
    });

    socket.on("call:accept", (payload: { callId: string; callerId: string }) => {
      if (!payload?.callerId) return;
      io?.to(`user:${payload.callerId}`).emit("call:accepted", {
        callId: payload.callId,
        byUserId: userId,
      });
    });

    socket.on("call:decline", (payload: { callId: string; callerId: string }) => {
      if (!payload?.callerId) return;
      io?.to(`user:${payload.callerId}`).emit("call:declined", {
        callId: payload.callId,
        byUserId: userId,
      });
    });

    socket.on("call:end", (payload: { callId: string; otherUserId: string }) => {
      if (!payload?.otherUserId) return;
      io?.to(`user:${payload.otherUserId}`).emit("call:ended", {
        callId: payload.callId,
        byUserId: userId,
      });
    });

    socket.on("call:signal", (payload: CallSignalPayload) => {
      if (!payload?.toUserId) return;
      io?.to(`user:${payload.toUserId}`).emit("call:signal", payload);
    });

    socket.on("disconnect", () => {
      for (const finalEntry of groupVoiceParticipants.entries()) {
        if (finalEntry[1].has(userId)) {
          removeParticipantFromVoiceRoom(socket, finalEntry[0], userId);
        }
      }
    });
  });

  return io;
}

export function emitMessageNew(payload: MessageEventPayload) {
  if (!io) return;

  io.to(`user:${payload.senderId}`).emit("message:new", {
    ...payload,
    isMine: true,
  });
  io.to(`user:${payload.receiverId}`).emit("message:new", {
    ...payload,
    isMine: false,
    isReadByOtherUser: false,
  });
}

export async function emitGroupMessageNew(payload: GroupMessageEventPayload) {
  if (!io) return;
  const sockets = await io.in(`group:${payload.communityId}`).fetchSockets();
  for (const socket of sockets) {
    const socketUserId = socket.data.user?.id?.toString?.() ?? "";
    socket.emit("group:message:new", {
      ...payload,
      isMine: socketUserId === payload.sender.id,
    });
  }
}

function removeParticipantFromVoiceRoom(
  socket: Socket,
  communityId: string,
  userId: string,
) {
  socket.leave(`group-voice:${communityId}`);
  const participants = groupVoiceParticipants.get(communityId);
  if (participants == null) {
    return;
  }

  const removedParticipant = participants.get(userId);
  participants.delete(userId);

  if (participants.size === 0) {
    groupVoiceParticipants.delete(communityId);
  } else {
    groupVoiceParticipants.set(communityId, participants);
  }

  if (removedParticipant != null) {
    io?.to(`group-voice:${communityId}`).emit("group:voice:user-left", {
      communityId,
      userId,
    });
  }
}
