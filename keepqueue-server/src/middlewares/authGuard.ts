import { type Request, type Response, type NextFunction } from "express";
import { verifyToken, getDocumentByIdOptional } from "../firebase";
import { cacheManager } from "../managers";
import { logger } from "../managers";
import { User } from "../types";

export interface AuthenticatedRequest extends Request {
    user?: {
        uid: string;
        email?: string;
        role?: string;
        isAdmin?: boolean;
    };
}

// The cache is filled by a Firestore snapshot listener, so a user created moments ago is
// not in it yet. Reading through to Firestore on a miss keeps a fresh signup from getting
// a spurious 403 on its first authenticated call.
const resolveUser = async (uid: string): Promise<User | undefined> => {
    const usersMap = cacheManager.get("usersMap", new Map());
    const cached = usersMap.get(uid) as User | undefined;
    if (cached) return cached;

    const fetched = (await getDocumentByIdOptional("users", uid)) as User | null;
    if (!fetched) return undefined;

    cacheManager.set("usersMap", [fetched], { merge: true, replacePrevValues: true });
    cacheManager.set("users", [fetched], { merge: true, replacePrevValues: true });
    return fetched;
};

export const authGuard = (requiredRole?: "business" | "customer" | "staff" | "admin") => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const decoded = await verifyToken(req.headers.authorization);

            req.user = {
                uid: decoded.uid,
                email: decoded.email,
                role: decoded.role || decoded.user_type,
                isAdmin: decoded.admin === true,
            };

            // Admin is proven by the custom claim alone. The users document is client-writable,
            // so trusting `type` there would let any account promote itself.
            if (requiredRole === "admin") {
                if (!req.user.isAdmin) {
                    res.status(403).json({ success: false, error: "Admin access required" });
                    return;
                }
                next();
                return;
            }

            if (requiredRole) {
                const user = await resolveUser(decoded.uid);

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
