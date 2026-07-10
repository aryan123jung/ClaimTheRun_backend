import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { NotificationService } from "../services/notification.services.ts";

const notificationService = new NotificationService();

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export class NotificationController {
  async getNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await notificationService.getNotifications(req.user!.id);
      return res.status(200).json({ success: true, data });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
    }
  }

  async markRead(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await notificationService.markRead(
        getParam(req.params.notificationId),
        req.user!.id,
      );
      return res.status(200).json({ success: true, data });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
    }
  }

  async markAllRead(req: AuthenticatedRequest, res: Response) {
    try {
      await notificationService.markAllRead(req.user!.id);
      return res.status(200).json({ success: true, message: "All notifications marked as read" });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Internal Server Error" });
    }
  }
}
