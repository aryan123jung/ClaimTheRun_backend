import z from "zod";

export const PostSchema = z.object({
  caption: z.string().trim().min(1).max(500),
  imageUrl: z.union([z.string().trim().url(), z.string().trim().startsWith("uploads/"), z.literal("")]).optional(),
});

export type PostType = z.infer<typeof PostSchema>;
