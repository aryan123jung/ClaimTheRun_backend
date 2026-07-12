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

type GroupRunParticipantPayload = {
  userId: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  latitude: number;
  longitude: number;
  updatedAt: string;
};

type GroupRunJoinPayload = {
  communityId: string;
  userId: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  latitude: number;
  longitude: number;
};

type GroupRunLocationPayload = {
  communityId: string;
  userId: string;
  latitude: number;
  longitude: number;
};

type GroupRunSessionPayload = {
  communityId: string;
  startedByUserId: string;
  startedAt: string;
};

let io: Server | null = null;
const groupVoiceParticipants = new Map<
  string,
  Map<string, GroupVoiceParticipantPayload>
>();
const groupRunParticipants = new Map<
  string,
  Map<string, GroupRunParticipantPayload>
>();
const groupRunSessions = new Map<string, GroupRunSessionPayload>();

function logGroupVoice(message: string) {
  console.log(`[GroupVoice] ${message}`);
}

function logGroupRun(message: string) {
  console.log(`[GroupRun] ${message}`);
}

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

    socket.on("group:run:join", (payload: GroupRunJoinPayload) => {
      if (
        !payload?.communityId ||
        !payload?.userId ||
        payload.userId !== userId ||
        typeof payload.latitude !== "number" ||
        typeof payload.longitude !== "number"
      ) {
        logGroupRun(
          `Rejected join for socket user=${userId} payloadUser=${payload?.userId} community=${payload?.communityId}`,
        );
        return;
      }

      const communityId = payload.communityId.trim();
      const roomKey = `group-run:${communityId}`;
      socket.join(roomKey);

      const participants =
        groupRunParticipants.get(communityId) ??
        new Map<string, GroupRunParticipantPayload>();
      const current: GroupRunParticipantPayload = {
        userId,
        name: payload.name?.toString().trim() || "Runner",
        username: payload.username?.toString().trim() || "runner",
        avatarUrl: payload.avatarUrl?.toString(),
        latitude: payload.latitude,
        longitude: payload.longitude,
        updatedAt: new Date().toISOString(),
      };
      const existingParticipants = Array.from(participants.values()).filter(
        (participant) => participant.userId !== userId,
      );

      participants.set(userId, current);
      groupRunParticipants.set(communityId, participants);
      logGroupRun(
        `Join community=${communityId} user=${userId} participants=[${Array.from(
          participants.keys(),
        ).join(", ")}]`,
      );

      socket.to(roomKey).emit("group:run:user-joined", {
        communityId,
        participant: current,
      });
      socket.emit("group:run:participants", {
        communityId,
        participants: existingParticipants,
        session: groupRunSessions.get(communityId) ?? null,
      });
      void emitGroupRunParticipantsSnapshot(communityId);
    });

    socket.on("group:run:update", (payload: GroupRunLocationPayload) => {
      if (
        !payload?.communityId ||
        !payload?.userId ||
        payload.userId !== userId ||
        typeof payload.latitude !== "number" ||
        typeof payload.longitude !== "number"
      ) {
        return;
      }

      const communityId = payload.communityId.trim();
      const participants = groupRunParticipants.get(communityId);
      if (!participants) {
        return;
      }

      const existing = participants.get(userId);
      if (!existing) {
        return;
      }

      const updated: GroupRunParticipantPayload = {
        ...existing,
        latitude: payload.latitude,
        longitude: payload.longitude,
        updatedAt: new Date().toISOString(),
      };
      participants.set(userId, updated);
      groupRunParticipants.set(communityId, participants);
      socket.to(`group-run:${communityId}`).emit("group:run:user-updated", {
        communityId,
        participant: updated,
      });
    });

    socket.on("group:run:start", (communityId: string) => {
      if (typeof communityId !== "string" || communityId.trim().length === 0) {
        return;
      }

      const trimmedCommunityId = communityId.trim();
      const participants = groupRunParticipants.get(trimmedCommunityId);
      if (!participants?.has(userId)) {
        logGroupRun(
          `Rejected start community=${trimmedCommunityId} user=${userId} reason=not_joined`,
        );
        return;
      }

      const current =
        groupRunSessions.get(trimmedCommunityId) ?? {
          communityId: trimmedCommunityId,
          startedByUserId: userId,
          startedAt: new Date().toISOString(),
        };

      groupRunSessions.set(trimmedCommunityId, current);
      logGroupRun(
        `Started community=${trimmedCommunityId} by=${current.startedByUserId} at=${current.startedAt}`,
      );
      io?.to(`group-run:${trimmedCommunityId}`).emit("group:run:started", current);
      void emitGroupRunParticipantsSnapshot(trimmedCommunityId);
    });

    socket.on("group:run:stop", (communityId: string) => {
      if (typeof communityId !== "string" || communityId.trim().length === 0) {
        return;
      }

      const trimmedCommunityId = communityId.trim();
      const existing = groupRunSessions.get(trimmedCommunityId);
      if (existing == null) {
        return;
      }

      groupRunSessions.delete(trimmedCommunityId);
      logGroupRun(`Stopped community=${trimmedCommunityId} by=${userId}`);
      io?.to(`group-run:${trimmedCommunityId}`).emit("group:run:stopped", {
        communityId: trimmedCommunityId,
        stoppedByUserId: userId,
      });
    });

    socket.on("group:run:leave", (communityId: string) => {
      if (typeof communityId !== "string" || communityId.trim().length === 0) {
        return;
      }
      removeParticipantFromRunRoom(socket, communityId.trim(), userId);
    });

    socket.on("group:voice:join", (payload: GroupVoiceJoinPayload) => {
      if (
        !payload?.communityId ||
        !payload?.userId ||
        payload.userId !== userId
      ) {
        logGroupVoice(
          `Rejected join for socket user=${userId} payloadUser=${payload?.userId} community=${payload?.communityId}`,
        );
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
      logGroupVoice(
        `Join community=${communityId} user=${userId} participants=[${Array.from(
          participants.keys(),
        ).join(", ")}]`,
      );

      socket.to(roomKey).emit("group:voice:user-joined", {
        communityId,
        participant: current,
      });
      socket.emit("group:voice:participants", {
        communityId,
        participants: existingParticipants,
      });
      void emitGroupVoiceParticipantsSnapshot(communityId);
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
        logGroupVoice(
          `Rejected signal from user=${userId} sender=${payload?.senderUserId} target=${payload?.targetUserId} community=${payload?.communityId}`,
        );
        return;
      }

      logGroupVoice(
        `Signal community=${payload.communityId} from=${payload.senderUserId} to=${payload.targetUserId} type=${payload.data?.type?.toString?.() ?? "unknown"}`,
      );

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
      for (const [communityId] of groupRunParticipants.entries()) {
        removeParticipantFromRunRoom(socket, communityId, userId);
      }
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
  logGroupVoice(
    `Leave community=${communityId} user=${userId} remaining=[${Array.from(
      participants.keys(),
    ).join(", ")}]`,
  );

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

function removeParticipantFromRunRoom(
  socket: Socket,
  communityId: string,
  userId: string,
) {
  const participants = groupRunParticipants.get(communityId);
  if (!participants?.has(userId)) {
    socket.leave(`group-run:${communityId}`);
    return;
  }

  participants.delete(userId);
  if (participants.size === 0) {
    groupRunParticipants.delete(communityId);
    groupRunSessions.delete(communityId);
  } else {
    groupRunParticipants.set(communityId, participants);
  }

  socket.leave(`group-run:${communityId}`);
  logGroupRun(
    `Leave community=${communityId} user=${userId} remaining=[${Array.from(
      participants?.keys?.() ?? [],
    ).join(", ")}]`,
  );
  io?.to(`group-run:${communityId}`).emit("group:run:user-left", {
    communityId,
    userId,
  });
  void emitGroupRunParticipantsSnapshot(communityId);
}

async function emitGroupRunParticipantsSnapshot(communityId: string) {
  if (!io) return;

  const participants = groupRunParticipants.get(communityId);
  const activeSession = groupRunSessions.get(communityId) ?? null;
  if (participants == null) {
    logGroupRun(`Snapshot skipped community=${communityId} no participants`);
    return;
  }

  const sockets = await io.in(`group-run:${communityId}`).fetchSockets();
  logGroupRun(
    `Snapshot community=${communityId} roomSockets=${sockets.length} participants=[${Array.from(
      participants.keys(),
    ).join(", ")}] session=${activeSession?.startedByUserId ?? "none"}`,
  );
  for (const socket of sockets) {
    const socketUserId = socket.data.user?.id?.toString?.() ?? "";
    const otherParticipants = Array.from(participants.values()).filter(
      (participant) => participant.userId !== socketUserId,
    );
    logGroupRun(
      `Snapshot -> socketUser=${socketUserId} sees=[${otherParticipants
        .map((participant) => participant.userId)
        .join(", ")}]`,
    );
    socket.emit("group:run:participants", {
      communityId,
      participants: otherParticipants,
      session: activeSession,
    });
  }
}
async function emitGroupVoiceParticipantsSnapshot(communityId: string) {
  if (!io) return;

  const participants = groupVoiceParticipants.get(communityId);
  if (participants == null) {
    logGroupVoice(`Snapshot skipped community=${communityId} no participants`);
    return;
  }

  const sockets = await io.in(`group-voice:${communityId}`).fetchSockets();
  logGroupVoice(
    `Snapshot community=${communityId} roomSockets=${sockets.length} participants=[${Array.from(
      participants.keys(),
    ).join(", ")}]`,
  );
  for (const socket of sockets) {
    const socketUserId = socket.data.user?.id?.toString?.() ?? "";
    const otherParticipants = Array.from(participants.values()).filter(
      (participant) => participant.userId !== socketUserId,
    );
    logGroupVoice(
      `Snapshot -> socketUser=${socketUserId} sees=[${otherParticipants
        .map((participant) => participant.userId)
        .join(", ")}]`,
    );
    socket.emit("group:voice:participants", {
      communityId,
      participants: otherParticipants,
    });
  }
}
