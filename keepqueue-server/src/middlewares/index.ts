export * from "./ownership";
import { type Request, type Response, type NextFunction } from "express";
import { AppError, jsonFailed, trimStrings } from "../helpers";
import { rateLimiter as rateLimiterImpl } from "./rateLimiter";
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

    // Only a message that was written for the caller is shown to them. Everything else is a
    // Firestore or runtime error whose text carries project ids and document paths, and this
    // handler is reachable from unauthenticated routes.
    if (err instanceof AppError) {
        res.status(err.status).json(jsonFailed(err.message));
        return;
    }

    res.status(500).json(jsonFailed("Internal server error"));
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
export { attachUserIfPresent } from "./attachUser";
export { rateLimiter } from "./rateLimiter";

/**
 * Ceiling for the endpoints that create records. The global 100/min is a network guard, not a
 * business rule: it lets one account mint a hundred appointments, reviews or waitlist entries
 * every minute, which is spam rather than use. Keyed by uid, so it follows the account.
 */
export const createLimiter = () => rateLimiterImpl(60 * 1000, 10, "create", true);
