import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
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

let io: Server | null = null;

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
