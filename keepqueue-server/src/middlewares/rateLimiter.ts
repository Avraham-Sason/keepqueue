import { type Request, type Response, type NextFunction } from "express";
import { MW } from "../types";
import { AuthenticatedRequest } from "./authGuard";

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
        if (now > entry.resetAt) {
            store.delete(key);
        }
    }
}, 5 * 60 * 1000);

/**
 * @param scope distinguishes one limiter from another. Without it every limiter shares a
 *              counter per IP, so a strict per-route ceiling would be consumed by traffic to
 *              unrelated routes.
 * @param perUser keys authenticated callers by uid instead of IP. A ceiling on record creation
 *              is about one account, not one network: a shared office IP should not exhaust it
 *              for everyone, and a single account should not escape it by changing address.
 */
export const rateLimiter = (windowMs: number = 60 * 1000, maxRequests: number = 100, scope: string = "global", perUser: boolean = false): MW => {
    return (req: Request, res: Response, next: NextFunction) => {
        const uid = perUser ? (req as AuthenticatedRequest).user?.uid : undefined;
        const key = `${scope}:${uid ?? req.ip ?? req.socket.remoteAddress ?? "unknown"}`;
        const now = Date.now();

        let entry = store.get(key);
        if (!entry || now > entry.resetAt) {
            entry = { count: 0, resetAt: now + windowMs };
            store.set(key, entry);
        }

        entry.count++;

        if (entry.count > maxRequests) {
            res.status(429).json({
                success: false,
                error: "Too many requests, please try again later",
            });
            return;
        }

        res.setHeader("X-RateLimit-Limit", maxRequests.toString());
        res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - entry.count).toString());
        res.setHeader("X-RateLimit-Reset", entry.resetAt.toString());

        next();
    };
};
