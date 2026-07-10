import bcryptjs from "bcryptjs";
import type { CreateUserDto, LoginUserDto, UpdateUserDto } from "../dtos/user.dtos.ts";
import { HttpError } from "../errors/http-error.ts";
import { UserRepository } from "../repositories/user.repository.ts";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from "../configs/index.ts";


const userRepository = new UserRepository();

export class UserService {
  async registerUser(userData: CreateUserDto) {
    const checkEmail = await userRepository.getUserByEmail(userData.email);

    if (checkEmail) {
      throw new HttpError(409, "Email already in use");
    }

    const checkUsername = await userRepository.getUserByUsername(
      userData.username
    );

    if (checkUsername) {
      throw new HttpError(409, "Username already in use");
    }

    const hashedPassword = await bcryptjs.hash(userData.password, 10);

    const newUser = await userRepository.createUser({
      ...userData,
      password: hashedPassword,
    });

    const { password, ...safeUser } = newUser.toObject();

    return safeUser;
  }


async loginUser(loginData: LoginUserDto) {
        const user = await userRepository.getUserByEmail(loginData.email);
        if (!user) {
            throw new HttpError(404, "User not found");
        }
        const validPassword = await bcryptjs.compare(loginData.password, user.password);
        if (!validPassword) {
            throw new HttpError(401, "Invalid Credential");
        }
        const payload = {
            id: user._id,
            email: user.email,
            // role: user.role,
        }
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
        return { token, user }
    }

  async getCurrentUser(userId: string) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    return user;
  }

  async updateCurrentUser(userId: string, userData: UpdateUserDto) {
    const user = await userRepository.updateUserById(userId, userData);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    return user;
  }

}
