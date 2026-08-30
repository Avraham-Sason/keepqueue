import { type Request, type Response, type NextFunction } from "express";
import { jsonFailed, trimStrings } from "../helpers";
import { MW } from "../types";
import { logger } from "../managers";
import { type ZodSchema } from "zod";

export const trimBodyMiddleware = (): MW => (req, res, next) => {
    if (req.body && typeof req.body === "object") {
        req.body = trimStrings(req.body);
    }
    return next();
};

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error("Global Error Handler:", err || "Unknown error");

    res.status(500).json({
        message: err?.message || "Internal Server Error",
    });
};

export const validateBody =
    <T>(schema: ZodSchema<T>): MW =>
    (req, res, next) => {
        const parseResult = schema.safeParse(req.body);
        if (!parseResult.success) {
            const issues = parseResult.error.issues.map((i) => ({
                path: i.path.join("."),
                message: i.message,
                code: i.code,
            }));
            return res.status(400).send(
                jsonFailed({
                    message: "Validation Error",
                    errors: issues,
                })
            );
        }
        req.body = parseResult.data as T;
        return next();
    };

export { authGuard } from "./authGuard";
export { rateLimiter } from "./rateLimiter";
