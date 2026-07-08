import { CreatePostDto } from "../dtos/post.dtos.ts";
import { HttpError } from "../errors/http-error.ts";
import { PostRepository } from "../repositories/post.repository.ts";
import { UserRepository } from "../repositories/user.repository.ts";

const postRepository = new PostRepository();
const userRepository = new UserRepository();

export class PostService {
  async createPost(userId: string, postData: CreatePostDto) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }

    const post = await postRepository.createPost({
      authorId: user._id,
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
