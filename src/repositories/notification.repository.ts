import { NotificationModel } from "../models/notification.model.ts";

export class NotificationRepository {
  async createNotification(notificationData: {
    userId: string;
    actorId: string;
    type: string;
    title: string;
    message: string;
    requestId?: string;
  }) {
    const notification = new NotificationModel(notificationData);
    await notification.save();
    return this.getById(notification._id.toString());
  }

  async getById(notificationId: string) {
    return NotificationModel.findById(notificationId).populate(
      "actorId",
      "fullname username profileUrl",
    );
  }

  async listForUser(userId: string) {
    return NotificationModel.find({ userId })
      .populate("actorId", "fullname username profileUrl")
      .sort({ createdAt: -1 });
  }

  async markRead(notificationId: string, userId: string) {
    await NotificationModel.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
    );
    return this.getById(notificationId);
  }

  async markAllRead(userId: string) {
    await NotificationModel.updateMany({ userId, isRead: false }, { isRead: true });
  }
}
