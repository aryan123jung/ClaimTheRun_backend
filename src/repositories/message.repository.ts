import mongoose from "mongoose";
import { MessageModel } from "../models/message.model.ts";

export class MessageRepository {
  async listForConversation(conversationId: string) {
    return MessageModel.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate("senderId receiverId", "fullname username profileUrl");
  }

  async createMessage(params: {
    conversationId: string;
    senderId: string;
    receiverId: string;
    text: string;
  }) {
    const message = new MessageModel({
      conversationId: params.conversationId,
      senderId: params.senderId,
      receiverId: params.receiverId,
      text: params.text,
      readBy: [params.senderId],
    });
    await message.save();
    return this.getById(message._id.toString());
  }

  async getById(messageId: string) {
    return MessageModel.findById(messageId).populate(
      "senderId receiverId",
      "fullname username profileUrl",
    );
  }

  async getLatestMessage(conversationId: string) {
    return MessageModel.findOne({ conversationId })
      .sort({ createdAt: -1 })
      .populate("senderId receiverId", "fullname username profileUrl");
  }

  async countUnread(conversationId: string, userId: string) {
    return MessageModel.countDocuments({
      conversationId,
      receiverId: userId,
      readBy: { $ne: new mongoose.Types.ObjectId(userId) },
    });
  }

  async markConversationRead(conversationId: string, userId: string) {
    await MessageModel.updateMany(
      {
        conversationId,
        receiverId: userId,
        readBy: { $ne: new mongoose.Types.ObjectId(userId) },
      },
      {
        $addToSet: { readBy: new mongoose.Types.ObjectId(userId) },
      },
    );
  }
}
