import z from "zod";
import { Response } from "express";
import { CreatePostDto } from "../dtos/post.dtos.ts";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.ts";
import { toUploadPath } from "../middlewares/upload.middleware.ts";
import { PostService } from "../services/post.services.ts";

const postService = new PostService();

export class PostController {
  async createPost(req: AuthenticatedRequest, res: Response) {
    try {
      const imageUrl = toUploadPath(req.file, "posts/images");
      const parsedData = CreatePostDto.safeParse({
        ...req.body,
        ...(imageUrl ? { imageUrl } : {}),
      });
      if (!parsedData.success) {
        return res.status(400).json({
          success: false,
          message: z.prettifyError(parsedData.error),
        });
      }

      const post = await postService.createPost(req.user!.id, parsedData.data);
      return res.status(201).json({
        success: true,
        message: "Post created successfully",
        data: post,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getPersonalFeed(req: AuthenticatedRequest, res: Response) {
    try {
      const posts = await postService.getPersonalFeed(req.user?.id);
      return res.status(200).json({
        success: true,
        message: "Posts fetched successfully",
        data: posts,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async getMyPosts(req: AuthenticatedRequest, res: Response) {
    try {
      const posts = await postService.getMyPosts(req.user!.id);
      return res.status(200).json({
        success: true,
        message: "My posts fetched successfully",
        data: posts,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }

  async toggleLike(req: AuthenticatedRequest, res: Response) {
    try {
      const postId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
      const post = await postService.toggleLike(postId, req.user!.id);
      return res.status(200).json({
        success: true,
        message: "Post updated successfully",
        data: post,
      });
    } catch (error: Error | any) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error",
      });
    }
  }
}
