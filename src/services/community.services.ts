import mongoose from "mongoose";
import { HttpError } from "../errors/http-error.ts";
import { CommunityRepository } from "../repositories/community.repository.ts";
import { UserRepository } from "../repositories/user.repository.ts";
import { PostService } from "./post.services.ts";

const communityRepository = new CommunityRepository();
const userRepository = new UserRepository();
const postService = new PostService();

function createSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export class CommunityService {
  async createCommunity(
    userId: string,
    data: { name: string; description: string; imageUrl?: string },
  ) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const name = data.name.trim();
    const description = data.description.trim();
    if (!name) {
      throw new HttpError(400, "Group name is required");
    }
    if (!description) {
      throw new HttpError(400, "Group description is required");
    }

    const baseSlug = createSlug(name);
    if (!baseSlug) {
      throw new HttpError(400, "Group name is invalid");
    }

    let slug = baseSlug;
    let suffix = 1;
    while (await communityRepository.getCommunityBySlug(slug)) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const community = await communityRepository.createCommunity({
      name,
      slug,
      description,
      imageUrl: data.imageUrl,
      creatorId: new mongoose.Types.ObjectId(userId),
      members: [new mongoose.Types.ObjectId(userId)],
    });

    return this.serializeCommunity(community, userId);
  }

  async getMyCommunities(userId: string) {
    const communities = await communityRepository.getCommunitiesByMember(userId);
    return communities.map((community) => this.serializeCommunity(community, userId));
  }

  async searchCommunities(userId: string, search?: string) {
    const communities = await communityRepository.searchCommunities(search);
    return communities.map((community) => this.serializeCommunity(community, userId));
  }

  async getCommunityById(communityId: string, userId: string) {
    const community = await communityRepository.getCommunityById(communityId);
    if (!community) {
      throw new HttpError(404, "Group not found");
    }

    return this.serializeCommunity(community, userId);
  }

  async joinCommunity(communityId: string, userId: string) {
    const community = await communityRepository.getCommunityById(communityId);
    if (!community) {
      throw new HttpError(404, "Group not found");
    }

    const updatedCommunity = await communityRepository.addMember(communityId, userId);
    return this.serializeCommunity(updatedCommunity, userId);
  }

  async leaveCommunity(communityId: string, userId: string) {
    const community = await communityRepository.getCommunityById(communityId);
    if (!community) {
      throw new HttpError(404, "Group not found");
    }

    if (community.creatorId._id?.toString?.() === userId || community.creatorId.toString() === userId) {
      throw new HttpError(400, "Group creator cannot leave the group");
    }

    const updatedCommunity = await communityRepository.removeMember(communityId, userId);
    return this.serializeCommunity(updatedCommunity, userId);
  }

  async getCommunityPosts(communityId: string, userId: string) {
    return postService.getCommunityPosts(communityId, userId);
  }

  private serializeCommunity(community: any, currentUserId: string) {
    const creator = community.creatorId;
    const members = Array.isArray(community.members) ? community.members : [];
    const memberIds = members.map((member: any) => member._id?.toString?.() ?? member.toString());

    return {
      id: community._id.toString(),
      name: community.name,
      slug: community.slug,
      description: community.description,
      imageUrl: community.imageUrl ?? null,
      memberCount: memberIds.length,
      isJoined: memberIds.includes(currentUserId),
      creator: {
        id: creator?._id?.toString?.() ?? "",
        fullname: creator?.fullname ?? "Unknown Runner",
        username: creator?.username ?? "",
        profileUrl: creator?.profileUrl ?? null,
      },
      createdAt: community.createdAt,
    };
  }
}
