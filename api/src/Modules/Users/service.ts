import bcrypt from "bcrypt";
import User from "./model";
import { IUser } from "./interface";
import HttpException from "../../Exceptions/HTTPExceptions";

export default class UserService {

  private static _instance: UserService | null = null;

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService._instance) {
      UserService._instance = new UserService();
    }

    return UserService._instance;
  }
  
  public async getAll(): Promise<IUser[]> {
    try {
      return await User.findAll();
    } catch (error) {
      throw new HttpException(500, "Failed to fetch users", error);
    }
  }

  public async getById(id: string): Promise<IUser | null> {
    try {
      return await User.findByPk(id);
    } catch (error) {
      throw new HttpException(500, "Failed to fetch user by id", error);
    }
  }

  public async getByEmail(email: string): Promise<IUser | null> {
    try {
      return await User.findOne({ where: { email } });
    } catch (error) {
      throw new HttpException(500, "Failed to fetch user by email", error);
    }
  }

  public async create(data: IUser): Promise<IUser> {
    try {
      const payload = {
        ...data,
        password: await bcrypt.hash(data.password, 10),
      };

      return await User.create(payload);
    } catch (error) {
      throw new HttpException(500, "Failed to create user", error);
    }
  }

  public async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    try {
      const user = await User.findByPk(id);

      if (!user) {
        return null;
      }

      const payload = data.password
        ? { ...data, password: await bcrypt.hash(data.password, 10) }
        : data;

      return await user.update(payload);
    } catch (error) {
      throw new HttpException(500, "Failed to update user", error);
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      const user = await User.findByPk(id);

      if (!user) {
        return false;
      }

      await user.destroy();
      return true;
    } catch (error) {
      throw new HttpException(500, "Failed to delete user", error);
    }
  }
}