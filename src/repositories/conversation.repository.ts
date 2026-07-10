import { ConversationModel } from "../models/conversation.model.ts";

export class ConversationRepository {
  buildParticipantsKey(userA: string, userB: string) {
    return [userA, userB].sort().join(":");
  }

  async findByParticipants(userA: string, userB: string) {
    const participantsKey = this.buildParticipantsKey(userA, userB);
    return ConversationModel.findOne({ participantsKey }).populate(
      "participants",
      "fullname username profileUrl",
    );
  }

  async createConversation(userA: string, userB: string) {
    const conversation = new ConversationModel({
      participants: [userA, userB],
      participantsKey: this.buildParticipantsKey(userA, userB),
      lastMessage: null,
      lastMessageAt: null,
    });
    await conversation.save();
    return this.findById(conversation._id.toString());
  }

  async findOrCreate(userA: string, userB: string) {
    const existing = await this.findByParticipants(userA, userB);
    if (existing) return existing;
    return this.createConversation(userA, userB);
  }

  async findById(conversationId: string) {
    return ConversationModel.findById(conversationId).populate(
      "participants",
      "fullname username profileUrl",
    );
  }

  async listForUser(userId: string) {
    return ConversationModel.find({ participants: userId })
      .populate("participants", "fullname username profileUrl")
      .sort({ lastMessageAt: -1, updatedAt: -1 });
  }

  async updateLastMessage(conversationId: string, text: string, createdAt: Date) {
    await ConversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: text,
      lastMessageAt: createdAt,
      updatedAt: createdAt,
    });
  }
}
