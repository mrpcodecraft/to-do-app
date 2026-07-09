import "reflect-metadata"; 
import Server from "./server";
import * as dotenv from "dotenv";

dotenv.config();

(async () => {
    try {
        if (!process.env.NODE_ENV || !process.env.PORT) {
            throw new Error("Invalid environment or port configurations in environment.");
        }
        
        const server = new Server(process.env.NODE_ENV, process.env.PORT);
        
        // Await the asynchronous startup loop (DB connection + Server boot)
        await server.start();
        
    } catch (err) {
        console.error("❌ Critical error starting application server:", err);
        process.exit(1);
    }
})();