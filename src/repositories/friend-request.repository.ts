import mongoose from "mongoose";
import {
  FriendRequestModel,
  IFriendRequest,
} from "../models/friend-request.model.ts";

export class FriendRequestRepository {
  async findRelationship(userA: string, userB: string) {
    return FriendRequestModel.findOne({
      $or: [
        { requesterId: userA, recipientId: userB },
        { requesterId: userB, recipientId: userA },
      ],
    }).populate("requesterId", "fullname username profileUrl");
  }

  async createRequest(requesterId: string, recipientId: string) {
    const request = new FriendRequestModel({
      requesterId,
      recipientId,
      status: "PENDING",
    });
    await request.save();
    return this.getById(request._id.toString());
  }

  async getById(requestId: string) {
    return FriendRequestModel.findById(requestId).populate(
      "requesterId recipientId",
      "fullname username profileUrl",
    );
  }

  async listIncoming(userId: string) {
    return FriendRequestModel.find({
      recipientId: userId,
      status: "PENDING",
    })
      .populate("requesterId", "fullname username profileUrl")
      .sort({ createdAt: -1 });
  }

  async listOutgoing(userId: string) {
    return FriendRequestModel.find({
      requesterId: userId,
      status: "PENDING",
    })
      .populate("recipientId", "fullname username profileUrl")
      .sort({ createdAt: -1 });
  }

  async listAcceptedForUser(userId: string) {
    return FriendRequestModel.find({
      status: "ACCEPTED",
      $or: [{ requesterId: userId }, { recipientId: userId }],
    });
  }

  async updateStatus(requestId: string, status: IFriendRequest["status"]) {
    await FriendRequestModel.findByIdAndUpdate(requestId, { status });
    return this.getById(requestId);
  }

  async deletePendingRequest(requesterId: string, recipientId: string) {
    return FriendRequestModel.findOneAndDelete({
      requesterId,
      recipientId,
      status: "PENDING",
    });
  }

  async deleteAcceptedFriendship(userA: string, userB: string) {
    return FriendRequestModel.findOneAndDelete({
      status: "ACCEPTED",
      $or: [
        { requesterId: userA, recipientId: userB },
        { requesterId: userB, recipientId: userA },
      ],
    });
  }

  async countMutualFriends(userA: string, userB: string) {
    const [friendsA, friendsB] = await Promise.all([
      this.listAcceptedForUser(userA),
      this.listAcceptedForUser(userB),
    ]);

    const normalizeFriendIds = (items: IFriendRequest[], currentUserId: string) =>
      new Set(
        items.map((item) =>
          item.requesterId.toString() === currentUserId
            ? item.recipientId.toString()
            : item.requesterId.toString(),
        ),
      );

    const a = normalizeFriendIds(friendsA, userA);
    const b = normalizeFriendIds(friendsB, userB);

    let count = 0;
    for (const id of a) {
      if (b.has(id)) count += 1;
    }
    return count;
  }

  getFriendUserId(item: IFriendRequest, currentUserId: string) {
    return item.requesterId.toString() === currentUserId
      ? item.recipientId.toString()
      : item.requesterId.toString();
  }
}
