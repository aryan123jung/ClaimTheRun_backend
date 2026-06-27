import { QueryFilter } from "mongoose";
import { IUser, UserModel } from "../models/user.model.ts";

export interface IUserRepository{
    getUserByEmail(email: string): Promise<IUser | null>;
    getUserByUsername(username: string): Promise<IUser | null>;

    createUser(userData: Partial<IUser>): Promise<IUser>;
    getUserById(userId: string):Promise <IUser | null>;
    // getAllusers(): Promise<IUser[]>;
    getAllusers(
        page: number, size: number, search?: string
    ): Promise<{users: IUser[], total: number}>;
}

export class UserRepository implements IUserRepository {
    getAllusers(page: number, size: number, search?: string): Promise<{ users: IUser[]; total: number; }> {
        throw new Error("Method not implemented.");
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
}