import { CreatePostDto } from "../dtos/post.dtos.ts";
import { HttpError } from "../errors/http-error.ts";
import mongoose from "mongoose";
import { CommunityRepository } from "../repositories/community.repository.ts";
import { PostRepository } from "../repositories/post.repository.ts";
import { UserRepository } from "../repositories/user.repository.ts";

const postRepository = new PostRepository();
const userRepository = new UserRepository();
const communityRepository = new CommunityRepository();

export class PostService {
  async createPost(userId: string, postData: CreatePostDto) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    if (postData.communityId) {
      const community = await communityRepository.getCommunityById(
        postData.communityId,
      );
      if (!community) {
        throw new HttpError(404, "Group not found");
      }

      const isMember = community.members.some(
        (member: any) => member._id?.toString?.() === userId || member.toString() === userId,
      );
      if (!isMember) {
        throw new HttpError(403, "Join the group before posting");
      }
    }

    const post = await postRepository.createPost({
      authorId: user._id,
      communityId: postData.communityId
        ? new mongoose.Types.ObjectId(postData.communityId)
        : undefined,
      caption: postData.caption,
      imageUrl: postData.imageUrl,
      likes: [],
      commentsCount: 0,
    });

    return this.serializePost(post, userId);
  }

  async getPersonalFeed(currentUserId?: string) {
    const posts = await postRepository.getPersonalFeed();
    return posts.map((post) => this.serializePost(post, currentUserId));
  }

  async getMyPosts(userId: string) {
    const posts = await postRepository.getPostsByAuthorId(userId);
    return posts.map((post) => this.serializePost(post, userId));
  }

  async getCommunityPosts(communityId: string, currentUserId?: string) {
    const community = await communityRepository.getCommunityById(communityId);
    if (!community) {
      throw new HttpError(404, "Group not found");
    }

    const posts = await postRepository.getPostsByCommunityId(communityId);
    return posts.map((post) => this.serializePost(post, currentUserId));
  }

  async toggleLike(postId: string, userId: string) {
    const post = await postRepository.toggleLike(postId, userId);
    if (!post) {
      throw new HttpError(404, "Post not found");
    }

    return this.serializePost(post, userId);
  }

  private serializePost(post: any, currentUserId?: string) {
    const author = post.authorId;
    const likes = Array.isArray(post.likes) ? post.likes : [];

    return {
      id: post._id.toString(),
      caption: post.caption,
      imageUrl: post.imageUrl ?? null,
      likeCount: likes.length,
      commentCount: post.commentsCount ?? 0,
      isLiked: currentUserId
        ? likes.some((like: any) => like.toString() === currentUserId)
        : false,
      createdAt: post.createdAt,
      author: {
        id: author?._id?.toString?.() ?? "",
        fullname: author?.fullname ?? "Unknown Runner",
        username: author?.username ?? "",
        profileUrl: author?.profileUrl ?? null,
      },
    };
  }
}
