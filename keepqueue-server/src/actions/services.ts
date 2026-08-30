import { jsonFailed, jsonOK } from "../helpers";
import { RouterService } from "../types";
import { auth, verifyToken, db, firebaseTimestamp } from "../firebase";
import { cacheManager } from "../managers";
import { logger } from "../managers";

export const SLogin: RouterService = async (req, res, next) => {
    try {
        // verifyToken throws on a missing or malformed header rather than returning null, so
        // without this the global handler turned a client error into a 500.
        let decoded;
        try {
            decoded = await verifyToken(req.headers.authorization);
        } catch {
            res.status(401).json(jsonFailed("Invalid or missing authorization token"));
            return;
        }

        const usersMap = cacheManager.get("usersMap", new Map());
        const user = usersMap.get(decoded.uid);

        if (user) {
            // Update last login
            await db.collection("users").doc(decoded.uid).update({
                lastLoginAt: firebaseTimestamp(),
                timestamp: firebaseTimestamp(),
            });

            // Sync custom claims if needed
            const currentClaims = decoded.role || decoded.user_type;
            if (currentClaims !== user.type) {
                await auth.setCustomUserClaims(decoded.uid, {
                    role: user.type,
                    user_type: user.type,
                });
            }

            res.json(jsonOK({ user, isNew: false }));
        } else {
            // New user — return minimal info, client will create the user document
            res.json(jsonOK({
                user: {
                    id: decoded.uid,
                    email: decoded.email,
                    phone: decoded.phone_number || "",
                },
                isNew: true,
            }));
        }
    } catch (error) {
        logger.error("Login error:", error);
        next(error);
    }
};

