import z, { email } from "zod";
import { UserSchema } from "../types/user.type.ts";


export const CreateUserDto = UserSchema.pick(
    {
        fullname: true,
        username: true,
        email: true,
        password: true,
        profileUrl: true,
    }
)

export type CreateUserDto = z.infer<typeof CreateUserDto>;



export const LoginUserDto = z.object({
    email: z.email(),
    password: z.string().min(6),
});
export type LoginUserDto = z.infer<typeof LoginUserDto>;



export const UpdateUserDto = UserSchema.partial();
export type UpdateUserDto = z.infer<typeof UpdateUserDto>;








