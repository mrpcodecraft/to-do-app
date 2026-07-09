import { Request, Response, NextFunction } from "express";
import UserService from "../../Modules/Users/service";
import AuthenticationService from "../../Modules/Authentication/service";

const userService = UserService.getInstance();
const authenticationService = AuthenticationService.getInstance(async (email) => userService.getByEmail(email));

type AuthenticatedRequest = Request & {
    user?: {
        id: string;
        tokenId: string;
    };
};

export function extractTokenFromAuthorizationHeader(authorizationHeader?: string | string[]): string | null {
    if (!authorizationHeader) {
        return null;
    }

    const headerValue = Array.isArray(authorizationHeader) ? authorizationHeader[0] : authorizationHeader;
    const parts = headerValue.trim().split(/\s+/);

    if (parts.length !== 2 || parts[0].toLowerCase() !== "jwt") {
        return null;
    }

    return parts[1] || null;
}

export default async function AuthenticationMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const headers = req.headers;
        const token = extractTokenFromAuthorizationHeader(headers.authorization);

        if (!token) {
            return res.status(401).send({ message: "Invalid token format. Expected 'JWT <token>'" });
        }

        const session = await authenticationService.validateSession(token);

        if (!session) {
            return res.status(401).send({ message: "Invalid or expired token" });
        }

        const authenticatedReq = req as AuthenticatedRequest;
        authenticatedReq.user = {
            id: session.userId,
            tokenId: session.tokenId,
        };

        return next();
    } catch (error) {
        return res.status(401).send({ message: "Invalid token" });
    }
}