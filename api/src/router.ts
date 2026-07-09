import { Application } from "express";
import { version } from "../package.json";
import AuthenticationController from "./Modules/Authentication/controller";
import UsersController from "./Modules/Users/controller";

export default class Router {
    private app: Application;

    constructor(app: Application) {
        this.app = app;
    }

    public initRoutes() {
        this.app.get("/", (req, res) => {
            res.send({ version });
        });

        this.app.use("/auth", AuthenticationController.getInstance().router);
        this.app.use("/admin", UsersController.getInstance().router);
    }
}