import { IUser } from "../Users/interface";

export interface ILoginPayload {
  email: string;
  password: string;
  deviceId?: string;
}

export interface IAuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

export interface ILoginResponse {
  accessToken: string;
  tokenId: string;
  expiresAt: Date;
  user: IAuthenticatedUser;
}

export interface ISessionRecord {
  tokenId: string;
  userId: string;
  deviceId: string;
  lastRequestAt: Date;
  expiresAt: Date;
  accessToken: string;
}

export interface ITokenPayload {
  sub: string;
  tokenId: string;
  deviceId: string;
  iat: number;
  exp: number;
}

export interface IUserLookup {
  (email: string): Promise<IUser | null>;
}
