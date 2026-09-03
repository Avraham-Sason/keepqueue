import { type Response, type NextFunction } from "express";
import { cacheManager } from "../managers";
import { Business } from "../types";
import { AuthenticatedRequest } from "./authGuard";

type BusinessIdResolver = (body: any) => string | undefined;

const fromMap = (mapKey: string, idField: string): BusinessIdResolver => (body) => {
    const id = body?.[idField];
    if (!id) return undefined;
    const map = cacheManager.get(mapKey, new Map()) as Map<string, any> | undefined;
    return map?.get(id)?.businessId;
};

const fromList = (listKey: string, idField: string): BusinessIdResolver => (body) => {
    const id = body?.[idField];
    if (!id) return undefined;
    return (cacheManager.get(listKey, []) as any[]).find((doc) => doc.id === id)?.businessId;
};

export const businessIdFrom = {
    body: (body: any) => body?.businessId as string | undefined,
    service: fromMap("servicesMap", "serviceId"),
    staff: fromList("staff", "staffId"),
    review: fromList("reviews", "reviewId"),
    calendarEvent: fromList("calendar", "calendarEventId"),
    waitItem: fromList("waitlist", "waitItemId"),
};

export const ownsBusiness = (uid: string, businessId: string | undefined): boolean => {
    if (!businessId) return false;
    const businesses = cacheManager.get("businessesMap", new Map()) as Map<string, Business> | undefined;
    const business = businesses?.get(businessId);
    return !!business && business.ownerId === uid;
};

/**
 * authGuard proves who the caller is and what type of account they hold. It does not prove the
 * caller owns the record they are acting on, so one business owner could reach another's data
 * with a valid token of their own. Every route that names a business must run this too.
 */
export const requireBusinessOwnership = (resolve: BusinessIdResolver = businessIdFrom.body) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const uid = req.user?.uid;
        if (!uid) {
            res.status(401).json({ success: false, error: "Authentication required" });
            return;
        }
        const businessId = resolve(req.body);
        if (!businessId) {
            res.status(404).json({ success: false, error: "Resource not found" });
            return;
        }
        if (!ownsBusiness(uid, businessId)) {
            res.status(403).json({ success: false, error: "You do not have access to this business" });
            return;
        }
        next();
    };
};

/**
 * A record that names both a customer and a business is reachable by that customer and by that
 * business, and by nobody else. Covers appointments and waitlist entries alike.
 */
export const requireRecordAccess = (listKey: string, idField: string) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const uid = req.user?.uid;
        if (!uid) {
            res.status(401).json({ success: false, error: "Authentication required" });
            return;
        }
        const record = (cacheManager.get(listKey, []) as any[]).find((item) => item.id === req.body?.[idField]);
        if (!record) {
            res.status(404).json({ success: false, error: "Resource not found" });
            return;
        }
        if (record.userId !== uid && !ownsBusiness(uid, record.businessId)) {
            res.status(403).json({ success: false, error: "You do not have access to this resource" });
            return;
        }
        next();
    };
};

/**
 * Booking on behalf of somebody else is only the business's privilege; a customer may book only
 * for themselves, whatever userId the request carries.
 */
export const requireSelfOrBusinessOwner = (userIdField: string = "userId") => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const uid = req.user?.uid;
        if (!uid) {
            res.status(401).json({ success: false, error: "Authentication required" });
            return;
        }
        if (req.body?.[userIdField] === uid) {
            next();
            return;
        }
        if (ownsBusiness(uid, businessIdFrom.body(req.body))) {
            next();
            return;
        }
        res.status(403).json({ success: false, error: "You may only act on your own behalf" });
    };
};

/**
 * Only the business decides when it is closed.
 *
 * `type` and `source` arrive in the request body, and requireSelfOrBusinessOwner deliberately
 * lets a customer through on their own userId so they can book for themselves. Together that
 * meant a customer could POST a VACATION event spanning months against any businessId — and
 * because overlap detection blocks on every non-terminal event regardless of type, a single
 * such event empties that business's availability permanently.
 *
 * A plain web booking still goes through the guard beside this one; anything else is the
 * business's own act and needs the business's own token.
 */
export const requireOwnerForNonBookingEvent = () => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const { type, source } = req.body ?? {};
        const isPlainBooking = (type === undefined || type === "APPOINTMENT") && (source === undefined || source === "web");
        if (isPlainBooking) {
            next();
            return;
        }
        const uid = req.user?.uid;
        if (!uid || !ownsBusiness(uid, businessIdFrom.body(req.body))) {
            res.status(403).json({ success: false, error: "Only the business may create this kind of event" });
            return;
        }
        next();
    };
};
