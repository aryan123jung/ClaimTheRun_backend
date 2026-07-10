import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { JWT_SECRET } from "../configs/index.ts";

type AuthSocketPayload = {
  id: string;
  email: string;
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
  });

  return io;
}

export function emitMessageNew(payload: MessageEventPayload) {
  if (!io) return;

  io.to(`user:${payload.senderId}`).emit("message:new", payload);
  io.to(`user:${payload.receiverId}`).emit("message:new", payload);
  io.to(`conversation:${payload.conversationId}`).emit("message:new", payload);
}
