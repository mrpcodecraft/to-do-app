import { Op } from "sequelize";
import HttpException from "../../../Exceptions/HTTPExceptions";
import Token from "./model";
import { ITokenCreatePayload, ITokenRecord } from "./interface";

export default class TokenService {
  private static _instance: TokenService | null = null;

  private constructor() {}

  public static getInstance(): TokenService {
    if (!TokenService._instance) {
      TokenService._instance = new TokenService();
    }
    return TokenService._instance;
  }

  public async create(payload: ITokenCreatePayload): Promise<ITokenRecord> {
    try {
      return await Token.create({
        userId: payload.userId,
        tokenId: payload.tokenId,
        tokenHash: payload.tokenHash,
        deviceId: payload.deviceId,
        lastUsedAt: new Date(),
        expiresAt: payload.expiresAt,
        revokedAt: null,
      });
    } catch (error) {
      throw new HttpException(500, "Failed to create token record", error);
    }
  }

  public async findByTokenId(tokenId: string): Promise<ITokenRecord | null> {
    try {
      return await Token.findOne({ where: { tokenId, revokedAt: null } });
    } catch (error) {
      throw new HttpException(500, "Failed to fetch token record", error);
    }
  }

  public async updateLastUsed(tokenId: string, expiresAt?: Date): Promise<void> {
    try {
      await Token.update(
        { lastUsedAt: new Date(), expiresAt: expiresAt ?? new Date(Date.now() + 60 * 60 * 1000) },
        { where: { tokenId, revokedAt: null } }
      );
    } catch (error) {
      throw new HttpException(500, "Failed to update token usage", error);
    }
  }

  public async revoke(tokenId: string): Promise<boolean> {
    try {
      const [updated] = await Token.update(
        { revokedAt: new Date() },
        { where: { tokenId, revokedAt: null } }
      );
      return updated > 0;
    } catch (error) {
      throw new HttpException(500, "Failed to revoke token", error);
    }
  }

  public async revokeAllForUser(userId: string): Promise<number> {
    try {
      const [updated] = await Token.update(
        { revokedAt: new Date() },
        { where: { userId, revokedAt: null } }
      );
      return updated;
    } catch (error) {
      throw new HttpException(500, "Failed to revoke user tokens", error);
    }
  }

  public async findActiveByUser(userId: string): Promise<ITokenRecord[]> {
    try {
      return await Token.findAll({
        where: {
          userId,
          revokedAt: null,
          expiresAt: { [Op.gt]: new Date() },
        },
      });
    } catch (error) {
      throw new HttpException(500, "Failed to fetch active tokens", error);
    }
  }

  public async removeExpired(): Promise<number> {
    try {
      return await Token.destroy({ where: { expiresAt: { [Op.lt]: new Date() } } });
    } catch (error) {
      throw new HttpException(500, "Failed to purge expired tokens", error);
    }
  }
}
