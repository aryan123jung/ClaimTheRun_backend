import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { MessageService } from "../services/message.services.ts";

const messageService = new MessageService();

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export class MessageController {
  async getConversations(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await messageService.getConversations(req.user!.id);
      return res.status(200).json({ success: true, data });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getOrCreateConversation(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await messageService.getOrCreateConversation(
        req.user!.id,
        getParam(req.params.otherUserId),
      );
      return res.status(200).json({ success: true, data });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await messageService.getMessages(
        req.user!.id,
        getParam(req.params.conversationId),
      );
      return res.status(200).json({ success: true, data });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async sendMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const text = typeof req.body?.text === "string" ? req.body.text : "";
      const data = await messageService.sendMessage(
        req.user!.id,
        getParam(req.params.conversationId),
        text,
      );
      return res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async markConversationRead(req: AuthenticatedRequest, res: Response) {
    try {
      await messageService.markConversationRead(
        req.user!.id,
        getParam(req.params.conversationId),
      );
      return res.status(200).json({
        success: true,
        message: "Conversation marked as read",
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
}
