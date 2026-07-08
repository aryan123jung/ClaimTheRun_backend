import z from "zod";
import { PostSchema } from "../types/post.type.ts";

export const CreatePostDto = PostSchema.transform((data) => ({
  caption: data.caption.trim(),
  imageUrl: data.imageUrl?.trim() ? data.imageUrl.trim() : undefined,
}));

export type CreatePostDto = z.infer<typeof CreatePostDto>;
