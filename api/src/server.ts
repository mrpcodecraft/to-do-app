import express, {Request, Response, NextFunction} from "express";
import bodyParser from "body-parser";
import {Server as HServer} from "http";
import path from "path";
import Router from "./router";
import ErrorHandlerMiddleware from "./Middlewares/ErrorHandler";
import Database from './Config/database.js';
import { setupSwagger } from "./swagger";

export default class Server {
    private app: express.Application | undefined ;
    private httpServer: HServer | undefined;
    private port: string;
    private env: string;
    private router: Router | undefined;

    constructor(env: string, port: string) {
        if (!env || !port) {
            throw new Error("Invalid environment or port");
        }

        this.port = port;
        this.env = env;
    }

    private async bootstrap(): Promise<void> {
        await Database.getInstance().connect();

        this.app = express();
        
        this.httpServer = new HServer(this.app);

        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        
        this.app.use(express.static(path.join(process.cwd(), "public")));

        this.app.use((req: Request, res: Response, next: NextFunction) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "*"); 
            res.header("Access-Control-Allow-Methods", "*");
            next();
        });

        this.router = new Router(this.app);
        this.router.initRoutes();
        setupSwagger(this.app);

        this.app.use(ErrorHandlerMiddleware); 
    }


    public async start(): Promise<void> {
        await this.bootstrap();

        if (!this.httpServer) {
            throw new Error("Express server is not initialized.");
        }

        this.httpServer.listen(this.port, () => {
            console.log(`Server running in ${this.env} mode on port ${this.port}`);
        });
    }
}