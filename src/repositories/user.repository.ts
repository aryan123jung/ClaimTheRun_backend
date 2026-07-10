import { QueryFilter } from "mongoose";
import { IUser, UserModel } from "../models/user.model.ts";

export interface IUserRepository{
    getUserByEmail(email: string): Promise<IUser | null>;
    getUserByUsername(username: string): Promise<IUser | null>;

    createUser(userData: Partial<IUser>): Promise<IUser>;
    getUserById(userId: string):Promise <IUser | null>;
    updateUserById(userId: string, userData: Partial<IUser>): Promise<IUser | null>;
    // getAllusers(): Promise<IUser[]>;
    getAllusers(
        page: number, size: number, search?: string
    ): Promise<{users: IUser[], total: number}>;
}

export class UserRepository implements IUserRepository {
    async getAllusers(page: number, size: number, search?: string): Promise<{ users: IUser[]; total: number; }> {
        const query: QueryFilter<IUser> = {};
        if (search?.trim()) {
            query.$or = [
                { fullname: { $regex: search.trim(), $options: "i" } },
                { username: { $regex: search.trim(), $options: "i" } },
            ];
        }
        const skip = (page - 1) * size;
        const [users, total] = await Promise.all([
            UserModel.find(query).select("-password").sort({ fullname: 1 }).skip(skip).limit(size),
            UserModel.countDocuments(query),
        ]);
        return { users, total };
    }
    async createUser(userData: Partial<IUser>): Promise<IUser> {
        const user = new UserModel(userData);
        await user.save();
        return user;
    }

    async getUserByEmail(email: string): Promise<IUser | null> {
        const user = await UserModel.findOne({ email });
        return user;
    }

    async getUserByUsername(username: string): Promise<IUser | null> {
        const user = await UserModel.findOne({ username });
        return user;
    }

    async getUserById(userId: string): Promise<IUser | null> {
        const user = await UserModel.findById(userId).select("-password");
        return user;
    }

    async updateUserById(userId: string, userData: Partial<IUser>): Promise<IUser | null> {
        const user = await UserModel.findByIdAndUpdate(
            userId,
            userData,
            { new: true }
        ).select("-password");
        return user;
    }
}
