import jwt from "jsonwebtoken";
import { ITokenPayload } from "./interface";

export function signToken(payload: ITokenPayload, secret: string) {
  return jwt.sign(payload, secret, { expiresIn: "1h" });
}

export function verifyToken(token: string, secret: string): ITokenPayload {
  return jwt.verify(token, secret) as unknown as ITokenPayload;
}
