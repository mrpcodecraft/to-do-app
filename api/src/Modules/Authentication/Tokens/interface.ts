export interface ITokenRecord {
  userId: string;
  tokenId: string;
  tokenHash: string;
  deviceId: string;
  lastUsedAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITokenCreatePayload {
  userId: string;
  tokenId: string;
  tokenHash: string;
  deviceId: string;
  expiresAt: Date;
}
