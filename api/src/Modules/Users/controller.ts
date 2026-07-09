import { Request, Response, NextFunction, Router } from "express";
import AuthenticationMiddleware from "../../Middlewares/Authentication";
import DTOValidationMiddleware from "../../Middlewares/DTOValidator";
import AdminUserDTO from "./dto";
import UserService from "./service";
import { IUser } from "./interface";


export default class AdminUserController {
    private static _instance: AdminUserController | null = null;

    public router: Router = Router({
        mergeParams: true,
        strict: true,
        caseSensitive: true
    });

    private constructor() {
        this.router = Router();
        this.initRoutes();
    }

    public static getInstance(): AdminUserController {
        if (!AdminUserController._instance) {
            AdminUserController._instance = new AdminUserController();
        }

        return AdminUserController._instance;
    }

    private initRoutes(): void {
        // this.router.use(AuthenticationMiddleware);
        this.router.get("/", this.getUsers);
        this.router.post("/", [DTOValidationMiddleware(AdminUserDTO)] ,this.addUser);
    }

    private async getUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const userService: UserService = UserService.getInstance();
            
            const data: IUser[] = await userService.getAll();
    
            res.send(data);
        } catch (error) {
            next(error);
        }
        
    }

    
    private async addUser(req: Request, res: Response, next: NextFunction) {
        try {
            const userService: UserService = UserService.getInstance();
            const payload = req.body as IUser;
            const user = await userService.create(payload);

            res.status(201).send({
                message: "Admin user added successfully",
                user,
            });
        } catch (error) {
            next(error);
        }
    }
}