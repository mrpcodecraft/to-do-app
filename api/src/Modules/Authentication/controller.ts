import { NextFunction, Request, Response, Router } from "express";
import DTOValidationMiddleware from "../../Middlewares/DTOValidator";
import { extractTokenFromAuthorizationHeader } from "../../Middlewares/Authentication";
import AuthenticationService from "./service";
import UserService from "../Users/service";
import { ILoginPayload } from "./interface";

export default class AuthenticationController {
  private static _instance: AuthenticationController | null = null;
  public router: Router = Router({ mergeParams: true, strict: true, caseSensitive: true });

  private constructor(private readonly authService: AuthenticationService) {
    this.router = Router();
    this.initRoutes();
  }

  public static getInstance(): AuthenticationController {
    if (!AuthenticationController._instance) {
      const userService = UserService.getInstance();
      const authService = AuthenticationService.getInstance(async (email) => {
        const response = await userService.getAll();
        return response.find((user) => user.email === email) ?? null;
      });

      AuthenticationController._instance = new AuthenticationController(authService);
    }

    return AuthenticationController._instance;
  }

  private initRoutes(): void {
    this.router.post("/login", DTOValidationMiddleware(LoginDTO), this.login.bind(this));
    this.router.post("/logout", this.logout.bind(this));
  }

  private async login(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = req.body as ILoginPayload;
      const response = await this.authService.login(payload);
      res.status(200).send(response);
    } catch (error) {
      next(error);
    }
  }

  private async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = extractTokenFromAuthorizationHeader(req.headers.authorization);
      if (!token) {
        res.status(400).send({ message: "Token is required and must be in the format 'JWT <token>'" });
        return;
      }

      const loggedOut = await this.authService.logout(token);
      res.status(loggedOut ? 200 : 401).send({ message: loggedOut ? "Logged out" : "Invalid token" });
    } catch (error) {
      next(error);
    }
  }
}

class LoginDTO {
  public email!: string;
  public password!: string;
  public deviceId?: string;
}
