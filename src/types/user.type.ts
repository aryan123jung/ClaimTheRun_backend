import z from "zod";

export const UserSchema = z.object({
    fullname: z.string(),
    email: z.email(),
    password:z.string().min(6),
    username:z.string().min(3),
    bio: z.string().optional(),
    profileUrl: z.string().optional(),
});

export type UserType = z.infer<typeof UserSchema>;
