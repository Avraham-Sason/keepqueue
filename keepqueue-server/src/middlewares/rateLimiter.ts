import { type Request, type Response, type NextFunction } from "express";
import { MW } from "../types";

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

export const rateLimiter = (windowMs: number = 60 * 1000, maxRequests: number = 100): MW => {
    return (req: Request, res: Response, next: NextFunction) => {
        const key = req.ip || req.socket.remoteAddress || "unknown";
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
