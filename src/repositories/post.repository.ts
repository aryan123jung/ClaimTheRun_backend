import mongoose from "mongoose";
import { IPost, PostModel } from "../models/post.model.ts";

export class PostRepository {
  async createPost(postData: Partial<IPost>) {
    const post = new PostModel(postData);
    await post.save();
    return this.getPostById(post._id.toString());
  }

  async getPostById(postId: string) {
    return PostModel.findById(postId).populate("authorId", "fullname username profileUrl");
  }

  async getPersonalFeed() {
    return PostModel.find()
      .populate("authorId", "fullname username profileUrl")
      .sort({ createdAt: -1 });
  }

  async getPostsByAuthorId(authorId: string) {
    return PostModel.find({ authorId })
      .populate("authorId", "fullname username profileUrl")
      .sort({ createdAt: -1 });
  }

  async toggleLike(postId: string, userId: string) {
    const post = await PostModel.findById(postId);
    if (!post) {
      return null;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const hasLiked = post.likes.some((likeId) => likeId.equals(userObjectId));

    post.likes = hasLiked
      ? post.likes.filter((likeId) => !likeId.equals(userObjectId))
      : [...post.likes, userObjectId];

    await post.save();

    return this.getPostById(postId);
  }
}
