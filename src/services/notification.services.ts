import { NotificationRepository } from "../repositories/notification.repository.ts";

const notificationRepository = new NotificationRepository();

export class NotificationService {
  async createFriendRequestSentNotification(
    actorName: string,
    actorId: string,
    recipientId: string,
    requestId: string,
  ) {
    return notificationRepository.createNotification({
      userId: recipientId,
      actorId,
      requestId,
      type: "FRIEND_REQUEST_SENT",
      title: "Friend Request",
      message: `${actorName} sent you a friend request.`,
    });
  }

  async createFriendRequestAcceptedNotification(actorName: string, actorId: string, recipientId: string) {
    return notificationRepository.createNotification({
      userId: recipientId,
      actorId,
      type: "FRIEND_REQUEST_ACCEPTED",
      title: "Friend Request Accepted",
      message: `${actorName} accepted your friend request.`,
    });
  }

  async createMessageNotification(
    actorName: string,
    actorId: string,
    recipientId: string,
    text: string,
  ) {
    return notificationRepository.createNotification({
      userId: recipientId,
      actorId,
      type: "MESSAGE_RECEIVED",
      title: "New Message",
      message: `${actorName}: ${text.length > 60 ? "${text.substring(0, 57)}..." : text}`,
    });
  }

  async getNotifications(userId: string) {
    const notifications = await notificationRepository.listForUser(userId);
    return notifications.map((item) => this.serializeNotification(item));
  }

  async markRead(notificationId: string, userId: string) {
    const notification = await notificationRepository.markRead(notificationId, userId);
    return notification ? this.serializeNotification(notification) : null;
  }

  async markAllRead(userId: string) {
    await notificationRepository.markAllRead(userId);
  }

  private serializeNotification(item: any) {
    const actor = item.actorId;
    return {
      id: item._id.toString(),
      title: item.title,
      message: item.message,
      type: item.type,
      isRead: item.isRead,
      createdAt: item.createdAt,
      actor: {
        id: actor?._id?.toString?.() ?? "",
        fullname: actor?.fullname ?? "Runner",
        username: actor?.username ?? "",
        profileUrl: actor?.profileUrl ?? null,
      },
      requestId: item.requestId?.toString?.() ?? null,
    };
  }
}
