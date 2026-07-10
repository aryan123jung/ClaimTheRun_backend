import { HttpError } from "../errors/http-error.ts";
import { ConversationRepository } from "../repositories/conversation.repository.ts";
import { FriendRequestRepository } from "../repositories/friend-request.repository.ts";
import { MessageRepository } from "../repositories/message.repository.ts";
import { UserRepository } from "../repositories/user.repository.ts";

const conversationRepository = new ConversationRepository();
const messageRepository = new MessageRepository();
const friendRequestRepository = new FriendRequestRepository();
const userRepository = new UserRepository();

export class MessageService {
  async getConversations(currentUserId: string) {
    const conversations = await conversationRepository.listForUser(currentUserId);
    return Promise.all(
      conversations.map((conversation) =>
        this.serializeConversation(conversation, currentUserId),
      ),
    );
  }

  async getOrCreateConversation(currentUserId: string, otherUserId: string) {
    await this.ensureCanMessage(currentUserId, otherUserId);
    const conversation = await conversationRepository.findOrCreate(
      currentUserId,
      otherUserId,
    );
    return this.serializeConversation(conversation, currentUserId);
  }

  async getMessages(currentUserId: string, conversationId: string) {
    const conversation = await this.getOwnedConversation(
      currentUserId,
      conversationId,
    );
    const messages = await messageRepository.listForConversation(conversationId);
    return messages.map((message) =>
      this.serializeMessage(message, currentUserId),
    );
  }

  async sendMessage(
    currentUserId: string,
    conversationId: string,
    text: string,
  ) {
    const conversation = await this.getOwnedConversation(
      currentUserId,
      conversationId,
    );
    const trimmed = text.trim();
    if (!trimmed) {
      throw new HttpError(400, "Message cannot be empty");
    }

    const otherUserId = this.getOtherParticipantId(conversation, currentUserId);
    await this.ensureCanMessage(currentUserId, otherUserId);

    const message = await messageRepository.createMessage({
      conversationId,
      senderId: currentUserId,
      receiverId: otherUserId,
      text: trimmed,
    });
    if (!message) {
      throw new HttpError(500, "Failed to send message");
    }

    await conversationRepository.updateLastMessage(
      conversationId,
      trimmed,
      message.createdAt,
    );

    return this.serializeMessage(message, currentUserId);
  }

  async markConversationRead(currentUserId: string, conversationId: string) {
    await this.getOwnedConversation(currentUserId, conversationId);
    await messageRepository.markConversationRead(conversationId, currentUserId);
  }

  private async getOwnedConversation(currentUserId: string, conversationId: string) {
    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new HttpError(404, "Conversation not found");
    }

    const isParticipant = conversation.participants.some(
      (participant: any) => participant._id.toString() === currentUserId,
    );

    if (!isParticipant) {
      throw new HttpError(403, "You cannot access this conversation");
    }

    return conversation;
  }

  private async ensureCanMessage(currentUserId: string, otherUserId: string) {
    if (currentUserId === otherUserId) {
      throw new HttpError(400, "You cannot message yourself");
    }

    const [currentUser, otherUser, relationship] = await Promise.all([
      userRepository.getUserById(currentUserId),
      userRepository.getUserById(otherUserId),
      friendRequestRepository.findRelationship(currentUserId, otherUserId),
    ]);

    if (!currentUser || !otherUser) {
      throw new HttpError(404, "User not found");
    }

    if (!relationship || relationship.status !== "ACCEPTED") {
      throw new HttpError(403, "You can only message your friends");
    }
  }

  private getOtherParticipantId(conversation: any, currentUserId: string) {
    const other = conversation.participants.find(
      (participant: any) => participant._id.toString() !== currentUserId,
    );
    if (!other?._id) {
      throw new HttpError(500, "Conversation participant not found");
    }
    return other._id.toString();
  }

  private async serializeConversation(conversation: any, currentUserId: string) {
    const otherUser = conversation.participants.find(
      (participant: any) => participant._id.toString() !== currentUserId,
    );
    const unreadCount = await messageRepository.countUnread(
      conversation._id.toString(),
      currentUserId,
    );

    return {
      id: conversation._id.toString(),
      lastMessageAt: conversation.lastMessageAt ?? conversation.updatedAt,
      updatedAt: conversation.updatedAt,
      unreadCount,
      otherUser: {
        id: otherUser?._id?.toString?.() ?? "",
        fullname: otherUser?.fullname ?? "Runner",
        username: otherUser?.username ?? "",
        profileUrl: otherUser?.profileUrl ?? null,
      },
      lastMessage: conversation.lastMessage
        ? {
            text: conversation.lastMessage,
            createdAt: conversation.lastMessageAt ?? conversation.updatedAt,
          }
        : null,
    };
  }

  private serializeMessage(message: any, currentUserId: string) {
    const senderId = message.senderId?._id?.toString?.() ?? "";
    const receiverId = message.receiverId?._id?.toString?.() ?? "";
    const readBy = Array.isArray(message.readBy)
      ? message.readBy.map((item: any) => item.toString())
      : [];

    return {
      id: message._id.toString(),
      conversationId: message.conversationId.toString(),
      text: message.text,
      senderId,
      receiverId,
      createdAt: message.createdAt,
      isMine: senderId === currentUserId,
      isReadByOtherUser:
        senderId === currentUserId && readBy.includes(receiverId),
    };
  }
}
