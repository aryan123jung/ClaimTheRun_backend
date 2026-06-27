import bcryptjs from "bcryptjs";
import type { CreateUserDto } from "../dtos/user.dtos.ts";
import { HttpError } from "../errors/http-error.ts";
import { UserRepository } from "../repositories/user.repository.ts";

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
}

