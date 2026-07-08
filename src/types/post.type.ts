import z from "zod";

const dataImageUrlSchema = z
  .string()
  .trim()
  .regex(/^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/, "Invalid image data");

export const PostSchema = z.object({
  caption: z.string().trim().min(1).max(500),
  imageUrl: z.union([z.string().trim().url(), dataImageUrlSchema, z.literal("")]).optional(),
});

export type PostType = z.infer<typeof PostSchema>;
