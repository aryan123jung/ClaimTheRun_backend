import { CommunityModel, ICommunity } from "../models/community.model.ts";

export class CommunityRepository {
  async createCommunity(data: Partial<ICommunity>) {
    const community = new CommunityModel(data);
    await community.save();
    return this.getCommunityById(community._id.toString());
  }

  async getCommunityById(communityId: string) {
    return CommunityModel.findById(communityId)
      .populate("creatorId", "fullname username profileUrl")
      .populate("members", "fullname username profileUrl");
  }

  async getCommunityBySlug(slug: string) {
    return CommunityModel.findOne({ slug })
      .populate("creatorId", "fullname username profileUrl")
      .populate("members", "fullname username profileUrl");
  }

  async getCommunitiesByMember(userId: string) {
    return CommunityModel.find({ members: userId })
      .populate("creatorId", "fullname username profileUrl")
      .populate("members", "fullname username profileUrl")
      .sort({ createdAt: -1 });
  }

  async searchCommunities(search?: string) {
    const filter = search?.trim()
      ? {
          $or: [
            { name: { $regex: search.trim(), $options: "i" } },
            { slug: { $regex: search.trim(), $options: "i" } },
          ],
        }
      : {};

    return CommunityModel.find(filter)
      .populate("creatorId", "fullname username profileUrl")
      .populate("members", "fullname username profileUrl")
      .sort({ createdAt: -1 });
  }

  async addMember(communityId: string, userId: string) {
    await CommunityModel.findByIdAndUpdate(communityId, {
      $addToSet: { members: userId },
    });
    return this.getCommunityById(communityId);
  }

  async removeMember(communityId: string, userId: string) {
    await CommunityModel.findByIdAndUpdate(communityId, {
      $pull: { members: userId },
    });
    return this.getCommunityById(communityId);
  }
}
