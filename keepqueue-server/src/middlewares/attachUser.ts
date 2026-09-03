import { type Response, type NextFunction } from "express";
import { verifyToken } from "../firebase";
import { AuthenticatedRequest } from "./authGuard";

/**
 * Identifies the caller when they present a token, and lets them through when they do not.
 *
 * Routes that serve the public booking page cannot use authGuard — an anonymous visitor has to
 * reach them — but they still need to know whether the caller is the owner, so they can decide
 * how much of the record to return. A malformed or expired token is treated as anonymous rather
 * than as an error: the response is built for the least-privileged reading either way.
 */
export const attachUserIfPresent = () => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.headers.authorization) {
            next();
            return;
        }
        try {
            const decoded = await verifyToken(req.headers.authorization);
            req.user = {
                uid: decoded.uid,
                email: decoded.email,
                role: decoded.role || decoded.user_type,
                isAdmin: decoded.admin === true,
            };
        } catch {
            // Anonymous. Never surface an auth error from a route that is public by design.
        }
        next();
    };
};
