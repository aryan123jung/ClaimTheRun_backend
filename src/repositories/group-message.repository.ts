import { GroupMessageModel } from "../models/group-message.model.ts";

export class GroupMessageRepository {
  async listForCommunity(communityId: string) {
    return GroupMessageModel.find({ communityId })
      .sort({ createdAt: 1 })
      .populate("senderId", "fullname username profileUrl")
      .select("_id communityId senderId text createdAt")
      .lean();
  }

  async createMessage(params: {
    communityId: string;
    senderId: string;
    text: string;
  }) {
    const message = new GroupMessageModel({
      communityId: params.communityId,
      senderId: params.senderId,
      text: params.text,
    });
    await message.save();
    return GroupMessageModel.findById(message._id)
      .populate("senderId", "fullname username profileUrl")
      .select("_id communityId senderId text createdAt")
      .lean();
  }
}
