import { HttpError } from "../errors/http-error.ts";
import { FriendRequestRepository } from "../repositories/friend-request.repository.ts";
import { UserRepository } from "../repositories/user.repository.ts";
import { NotificationService } from "./notification.services.ts";

const friendRequestRepository = new FriendRequestRepository();
const userRepository = new UserRepository();
const notificationService = new NotificationService();

export class FriendRequestService {
  async searchUsers(currentUserId: string, search?: string) {
    const { users } = await userRepository.getAllusers(1, 25, search);
    const filtered = users.filter((user) => user._id.toString() !== currentUserId);

    return Promise.all(
      filtered.map(async (user) => {
        const relationship = await friendRequestRepository.findRelationship(
          currentUserId,
          user._id.toString(),
        );
        const mutualFriends = await friendRequestRepository.countMutualFriends(
          currentUserId,
          user._id.toString(),
        );
        return this.serializeSearchUser(user, relationship, currentUserId, mutualFriends);
      }),
    );
  }

  async sendRequest(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new HttpError(400, "You cannot send a friend request to yourself");
    }

    const [currentUser, targetUser] = await Promise.all([
      userRepository.getUserById(currentUserId),
      userRepository.getUserById(targetUserId),
    ]);

    if (!currentUser || !targetUser) {
      throw new HttpError(404, "User not found");
    }

    const relationship = await friendRequestRepository.findRelationship(
      currentUserId,
      targetUserId,
    );

    if (relationship?.status === "ACCEPTED") {
      throw new HttpError(409, "You are already friends");
    }

    if (
      relationship?.status === "PENDING" &&
      relationship.requesterId._id.toString() === currentUserId
    ) {
      throw new HttpError(409, "Friend request already sent");
    }

    if (
      relationship?.status === "PENDING" &&
      relationship.requesterId._id.toString() === targetUserId
    ) {
      const accepted = await friendRequestRepository.updateStatus(
        relationship._id.toString(),
        "ACCEPTED",
      );
      await notificationService.createFriendRequestAcceptedNotification(
        currentUser.fullname,
        currentUserId,
        targetUserId,
      );
      return this.serializeRequest(accepted, currentUserId);
    }

    const request = await friendRequestRepository.createRequest(
      currentUserId,
      targetUserId,
    );
    if (!request) {
      throw new HttpError(500, "Failed to create friend request");
    }

    await notificationService.createFriendRequestSentNotification(
      currentUser.fullname,
      currentUserId,
      targetUserId,
      request._id.toString(),
    );

    return this.serializeRequest(request, currentUserId);
  }

  async cancelRequest(currentUserId: string, targetUserId: string) {
    const deleted = await friendRequestRepository.deletePendingRequest(
      currentUserId,
      targetUserId,
    );
    if (!deleted) {
      throw new HttpError(404, "Pending friend request not found");
    }
  }

  async getIncomingRequests(currentUserId: string) {
    const requests = await friendRequestRepository.listIncoming(currentUserId);
    return requests.map((item) => this.serializeRequest(item, currentUserId));
  }

  async getOutgoingRequests(currentUserId: string) {
    const requests = await friendRequestRepository.listOutgoing(currentUserId);
    return requests.map((item) => this.serializeRequest(item, currentUserId));
  }

  async acceptRequest(currentUserId: string, requestId: string) {
    const request = await friendRequestRepository.getById(requestId);
    if (!request || request.recipientId._id.toString() !== currentUserId) {
      throw new HttpError(404, "Friend request not found");
    }
    if (request.status !== "PENDING") {
      throw new HttpError(400, "Only pending requests can be accepted");
    }

    const updated = await friendRequestRepository.updateStatus(requestId, "ACCEPTED");
    const currentUser = await userRepository.getUserById(currentUserId);

    if (currentUser) {
      await notificationService.createFriendRequestAcceptedNotification(
        currentUser.fullname,
        currentUserId,
        request.requesterId._id.toString(),
      );
    }

    return this.serializeRequest(updated, currentUserId);
  }

  async rejectRequest(currentUserId: string, requestId: string) {
    const request = await friendRequestRepository.getById(requestId);
    if (!request || request.recipientId._id.toString() !== currentUserId) {
      throw new HttpError(404, "Friend request not found");
    }
    if (request.status !== "PENDING") {
      throw new HttpError(400, "Only pending requests can be rejected");
    }

    const updated = await friendRequestRepository.updateStatus(requestId, "REJECTED");
    return this.serializeRequest(updated, currentUserId);
  }

  async unfriend(currentUserId: string, targetUserId: string) {
    const deleted = await friendRequestRepository.deleteAcceptedFriendship(
      currentUserId,
      targetUserId,
    );
    if (!deleted) {
      throw new HttpError(404, "Friendship not found");
    }
  }

  private serializeSearchUser(user: any, relationship: any, currentUserId: string, mutualFriends: number) {
    let friendStatus = "NONE";
    let requestId: string | null = null;

    if (relationship) {
      requestId = relationship._id.toString();
      if (relationship.status === "ACCEPTED") {
        friendStatus = "FRIEND";
      } else if (relationship.status === "PENDING") {
        friendStatus =
          relationship.requesterId._id.toString() === currentUserId
            ? "PENDING_OUTGOING"
            : "PENDING_INCOMING";
      } else if (relationship.status === "REJECTED") {
        friendStatus = "NONE";
      }
    }

    return {
      id: user._id.toString(),
      fullname: user.fullname,
      username: user.username,
      profileUrl: user.profileUrl ?? null,
      mutualFriends,
      friendStatus,
      requestId,
    };
  }

  private serializeRequest(item: any, currentUserId: string) {
    const requester = item.requesterId;
    const recipient = item.recipientId;
    const isIncoming = recipient?._id?.toString?.() === currentUserId;
    const otherUser = isIncoming ? requester : recipient;

    return {
      id: item._id.toString(),
      status: item.status,
      isIncoming,
      createdAt: item.createdAt,
      user: {
        id: otherUser?._id?.toString?.() ?? "",
        fullname: otherUser?.fullname ?? "Runner",
        username: otherUser?.username ?? "",
        profileUrl: otherUser?.profileUrl ?? null,
      },
    };
  }
}
