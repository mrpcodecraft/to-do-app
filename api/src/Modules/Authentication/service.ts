import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import HttpException from "../../Exceptions/HTTPExceptions";

const bcrypt = require("bcrypt");
import TokenService from "./Tokens/service";
import {
  ILoginPayload,
  ILoginResponse,
  ISessionRecord,
  ITokenPayload,
  IUserLookup,
} from "./interface";

export default class AuthenticationService {
  private static _instance: AuthenticationService | null = null;
  private readonly userLookup: IUserLookup;
  private readonly jwtSecret: string;
  private readonly tokenTTLInMs: number;
  private readonly tokenService: TokenService;

  constructor(userLookup: IUserLookup, jwtSecret = process.env.JWT_SECRET || "dev-secret", tokenService?: TokenService) {
    this.userLookup = userLookup;
    this.jwtSecret = jwtSecret;
    this.tokenTTLInMs = 60 * 60 * 1000;
    this.tokenService = tokenService ?? TokenService.getInstance();
  }

  public static getInstance(userLookup?: IUserLookup, jwtSecret = process.env.JWT_SECRET || "dev-secret", tokenService?: TokenService): AuthenticationService {
    if (!AuthenticationService._instance) {
      if (!userLookup) {
        throw new Error("A user lookup function is required before initializing authentication service.");
      }

      AuthenticationService._instance = new AuthenticationService(userLookup, jwtSecret, tokenService);
    }

    return AuthenticationService._instance;
  }

  public async login(payload: ILoginPayload): Promise<ILoginResponse> {
    const user = await this.userLookup(payload.email);

    if (!user) {
      throw new HttpException(401, "Invalid credentials", null);
    }

    const isPasswordValid = await bcrypt.compare(payload.password, user.password);
    if (!isPasswordValid) {
      throw new HttpException(401, "Invalid credentials", null);
    }

    const activeSessions = await this.tokenService.findActiveByUser(user.id!);
    if (activeSessions.length >= 2) {
      throw new HttpException(403, "You can only be logged in on 2 devices at a time", null);
    }

    const tokenId = uuidv4();
    const deviceId = payload.deviceId || "default-device";
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + this.tokenTTLInMs);

    const accessToken = jwt.sign(
      {
        sub: user.id,
        tokenId,
        deviceId,
      } as ITokenPayload,
      this.jwtSecret,
      { expiresIn: "1h" }
    );

    const tokenHash = await bcrypt.hash(accessToken, 10);

    await this.tokenService.create({
      userId: user.id!,
      tokenId,
      tokenHash,
      deviceId,
      expiresAt,
    });

    return {
      accessToken,
      tokenId,
      expiresAt,
      user: {
        id: user.id!,
        name: user.name,
        email: user.email,
      },
    };
  }

  public async validateSession(token: string): Promise<ISessionRecord | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as unknown as ITokenPayload;
      const record = await this.tokenService.findByTokenId(decoded.tokenId);

      if (!record) {
        return null;
      }

      const isTokenValid = await bcrypt.compare(token, record.tokenHash);
      if (!isTokenValid) {
        return null;
      }

      if (record.userId !== decoded.sub || record.deviceId !== decoded.deviceId) {
        return null;
      }

      const now = new Date();
      if (record.expiresAt.getTime() <= now.getTime() || record.revokedAt) {
        await this.tokenService.revoke(record.tokenId);
        return null;
      }

      const lastRequestAt = record.lastUsedAt;
      if (now.getTime() - lastRequestAt.getTime() > this.tokenTTLInMs) {
        await this.tokenService.revoke(record.tokenId);
        return null;
      }

      const refreshedExpiresAt = new Date(now.getTime() + this.tokenTTLInMs);
      await this.tokenService.updateLastUsed(record.tokenId, refreshedExpiresAt);

      return {
        tokenId: decoded.tokenId,
        userId: record.userId,
        deviceId: record.deviceId,
        lastRequestAt: now,
        expiresAt: refreshedExpiresAt,
        accessToken: token,
      };
    } catch {
      return null;
    }
  }

  public async logout(token: string): Promise<boolean> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as unknown as ITokenPayload;
      const record = await this.tokenService.findByTokenId(decoded.tokenId);
      if (!record) {
        return false;
      }

      const isTokenValid = await bcrypt.compare(token, record.tokenHash);
      if (!isTokenValid) {
        return false;
      }

      if (record.userId !== decoded.sub || record.deviceId !== decoded.deviceId) {
        return false;
      }

      return await this.tokenService.revoke(record.tokenId);
    } catch {
      return false;
    }
  }
}
