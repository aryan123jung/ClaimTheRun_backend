import z, { email } from "zod";
import { UserSchema } from "../types/user.type.ts";


export const CreateUserDto = UserSchema.pick(
    {
        fullname: true,
        username: true,
        email: true,
        password: true,
        bio: true,
        profileUrl: true,
    }
)

export type CreateUserDto = z.infer<typeof CreateUserDto>;



export const LoginUserDto = z.object({
    email: z.email(),
    password: z.string().min(6),
});
export type LoginUserDto = z.infer<typeof LoginUserDto>;



export const UpdateUserDto = z.object({
    fullname: z.string().min(1).optional(),
    bio: z.string().max(160).optional(),
    profileUrl: z.string().optional(),
});
export type UpdateUserDto = z.infer<typeof UpdateUserDto>;







