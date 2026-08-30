import { type Request, type Response, type NextFunction } from "express";
import { verifyToken } from "../firebase";
import { cacheManager } from "../managers";
import { logger } from "../managers";
import { User } from "../types";

export interface AuthenticatedRequest extends Request {
    user?: {
        uid: string;
        email?: string;
        role?: string;
    };
}

export const authGuard = (requiredRole?: "business" | "customer" | "staff") => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const decoded = await verifyToken(req.headers.authorization);

            req.user = {
                uid: decoded.uid,
                email: decoded.email,
                role: decoded.role || decoded.user_type,
            };

            if (requiredRole) {
                const usersMap = cacheManager.get("usersMap", new Map());
                const user = usersMap.get(decoded.uid) as User | undefined;

                if (!user) {
                    res.status(403).json({ success: false, error: "User not found" });
                    return;
                }

                if (requiredRole === "business" && user.type !== "business") {
                    res.status(403).json({ success: false, error: "Business access required" });
                    return;
                }

                if (requiredRole === "customer" && user.type !== "customer") {
                    res.status(403).json({ success: false, error: "Customer access required" });
                    return;
                }

                if (requiredRole === "staff") {
                    // Staff access: business owners or staff members
                    if (user.type !== "business") {
                        const staffList = cacheManager.get("staff", []) as any[];
                        const isStaff = staffList.some((s) => s.email === user.email && s.isActive);
                        if (!isStaff) {
                            res.status(403).json({ success: false, error: "Staff access required" });
                            return;
                        }
                    }
                }
            }

            next();
        } catch (error) {
            logger.error("Auth guard error:", error);
            res.status(401).json({ success: false, error: "Authentication required" });
        }
    };
};
