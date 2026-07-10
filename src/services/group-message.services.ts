import { HttpError } from "../errors/http-error.ts";
import { CommunityRepository } from "../repositories/community.repository.ts";
import { GroupMessageRepository } from "../repositories/group-message.repository.ts";
import { emitGroupMessageNew } from "../realtime/socket.ts";

const communityRepository = new CommunityRepository();
const groupMessageRepository = new GroupMessageRepository();

export class GroupMessageService {
  async getMessages(currentUserId: string, communityId: string) {
    await this.getJoinedCommunity(currentUserId, communityId);
    const messages = await groupMessageRepository.listForCommunity(communityId);
    return messages.map((message) =>
      this.serializeMessage(message, currentUserId),
    );
  }

  async sendMessage(currentUserId: string, communityId: string, text: string) {
    await this.getJoinedCommunity(currentUserId, communityId);
    const trimmed = text.trim();
    if (!trimmed) {
      throw new HttpError(400, "Message cannot be empty");
    }

    const message = await groupMessageRepository.createMessage({
      communityId,
      senderId: currentUserId,
      text: trimmed,
    });

    if (!message) {
      throw new HttpError(500, "Failed to send group message");
    }

    const serialized = this.serializeMessage(message, currentUserId);
    emitGroupMessageNew(serialized);
    return serialized;
  }

  private async getJoinedCommunity(currentUserId: string, communityId: string) {
    const community = await communityRepository.getCommunityById(communityId);
    if (!community) {
      throw new HttpError(404, "Group not found");
    }

    const memberIds = Array.isArray(community.members)
      ? community.members.map((member: any) => member._id?.toString?.() ?? member.toString())
      : [];

    if (!memberIds.includes(currentUserId)) {
      throw new HttpError(403, "You can only access chats for joined groups");
    }

    return community;
  }

  private serializeMessage(message: any, currentUserId: string) {
    const sender = message.senderId;
    const senderId = sender?._id?.toString?.() ?? message.senderId?.toString?.() ?? "";

    return {
      id: message._id.toString(),
      communityId: message.communityId.toString(),
      text: message.text,
      createdAt: message.createdAt,
      sender: {
        id: senderId,
        fullname: sender?.fullname ?? "Runner",
        username: sender?.username ?? "",
        profileUrl: sender?.profileUrl ?? null,
      },
      isMine: senderId === currentUserId,
    };
  }
}
