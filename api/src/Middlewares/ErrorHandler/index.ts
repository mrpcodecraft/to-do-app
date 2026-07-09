import { NextFunction, Request, Response } from "express";
import HttpException from "../../Exceptions/HTTPExceptions";

export default function ErrorHandlerMiddleware (err: HttpException, req: Request, res: Response, next: NextFunction) {
    if (err) {
        const status = err.status || 500;
        const message = err.message || "Server error";

        res.status(status);

        res.json({
            status,
            message
        });
    }
}