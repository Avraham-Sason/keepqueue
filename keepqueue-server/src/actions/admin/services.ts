import { jsonFailed, jsonOK } from "../../helpers";
import { logAudit } from "../../helpers/audit";
import { RouterService, Business, User, OperationSchedule } from "../../types";
import { auth, db, firebaseTimestamp } from "../../firebase";
import { FieldValue } from "firebase-admin/firestore";
import { cacheManager } from "../../managers";
import { CreateBusinessModel, CreateUserModel, SetBusinessActiveModel } from "./schemes";
import { AuthenticatedRequest } from "../../middlewares/authGuard";

// Sunday-Thursday, 09:00-17:00 — the common Israeli work week. The admin can change it
// per business afterwards; a business with no schedule at all offers no slots.
const DEFAULT_SCHEDULE: OperationSchedule[] = ([0, 1, 2, 3, 4] as const).map((day) => ({
    day,
    intervals: [{ startMin: 9 * 60, endMin: 17 * 60 }],
}));

// Writes land in Firestore first and reach the cache through the snapshot listener a moment
// later. Seeding both here keeps the very next request from missing the document.
const seedCache = (collection: "users" | "businesses", doc: any) => {
    const mapKey = collection === "users" ? "usersMap" : "businessesMap";
    cacheManager.set(collection, [doc], { merge: true, replacePrevValues: true });
    cacheManager.set(mapKey, [doc], { merge: true, replacePrevValues: true });
};

export const SAdminCreateUser: RouterService = async (req, res, next) => {
    let createdUid: string | undefined;
    try {
        const { email, password, firstName, lastName, phone, type } = req.body as CreateUserModel;
        const normalizedEmail = email.trim().toLowerCase();

        const existing = await auth.getUserByEmail(normalizedEmail).catch(() => null);
        if (existing) {
            res.status(409).json(jsonFailed("A user with this email already exists"));
            return;
        }

        const authUser = await auth.createUser({
            email: normalizedEmail,
            password,
            displayName: `${firstName} ${lastName}`.trim(),
        });
        createdUid = authUser.uid;

        const now = firebaseTimestamp();
        const base = {
            id: authUser.uid,
            email: normalizedEmail,
            phone,
            firstName,
            lastName,
            isActive: true,
            contacts: { sms: true, email: true },
            created: now,
            timestamp: now,
            photoURL: "",
        };
        const userDoc: any =
            type === "business"
                ? { ...base, type: "business", ownedBusinessIds: [] }
                : { ...base, type: "customer", businessIds: [], blockedByBusinessIds: [] };

        // Document id == Auth uid. Every ownership and role check on the server resolves
        // users by uid, so any other id makes the account unusable.
        await db.collection("users").doc(authUser.uid).set(userDoc);
        seedCache("users", userDoc);

        res.json(jsonOK({ userId: authUser.uid, email: normalizedEmail, type }));
    } catch (error) {
        // Do not leave an Auth account behind that has no profile to go with it.
        if (createdUid) await auth.deleteUser(createdUid).catch(() => undefined);
        next(error);
    }
};

export const SAdminCreateBusiness: RouterService = async (req, res, next) => {
    try {
        const body = req.body as CreateBusinessModel;
        const usersMap = cacheManager.get("usersMap", new Map());
        const owner = usersMap.get(body.ownerId) as User | undefined;

        if (!owner) {
            res.status(404).json(jsonFailed("Owner not found"));
            return;
        }
        if (owner.type !== "business") {
            res.status(422).json(jsonFailed("Owner must be a business account"));
            return;
        }

        const now = firebaseTimestamp();
        const businessRef = db.collection("businesses").doc();
        const business: Business = {
            id: businessRef.id,
            name: body.name,
            ownerId: body.ownerId,
            phone: body.phone ?? "",
            address: body.address ?? "",
            categories: body.categories ?? [],
            ratingAvg: 0,
            ratingCount: 0,
            isActive: body.isActive ?? true,
            operationSchedule: body.operationSchedule ?? DEFAULT_SCHEDULE,
            currency: body.currency ?? "ILS",
            lang: body.lang ?? "he",
            timezone: body.timezone ?? "Asia/Jerusalem",
            created: now,
            timestamp: now,
        };

        // The business and the owner's link to it have to land together, or the owner ends
        // up on a dashboard for a business they do not own (or vice versa).
        const batch = db.batch();
        batch.set(businessRef, business);
        batch.update(db.collection("users").doc(body.ownerId), {
            ownedBusinessIds: FieldValue.arrayUnion(businessRef.id),
            timestamp: now,
        });
        await batch.commit();

        seedCache("businesses", business);
        seedCache("users", {
            ...owner,
            ownedBusinessIds: [...(("ownedBusinessIds" in owner && owner.ownedBusinessIds) || []), businessRef.id],
        });

        logAudit({
            businessId: businessRef.id,
            userId: (req as AuthenticatedRequest).user?.uid ?? "",
            entity: "businesses",
            action: "create",
            subEntity: businessRef.id,
        });

        res.json(jsonOK(business));
    } catch (error) {
        next(error);
    }
};

export const SAdminSetBusinessActive: RouterService = async (req, res, next) => {
    try {
        const { businessId, isActive } = req.body as SetBusinessActiveModel;
        const businessesMap = cacheManager.get("businessesMap", new Map());
        const business = businessesMap.get(businessId) as Business | undefined;

        if (!business) {
            res.status(404).json(jsonFailed("Business not found"));
            return;
        }

        await db.collection("businesses").doc(businessId).update({ isActive, timestamp: firebaseTimestamp() });
        seedCache("businesses", { ...business, isActive });

        logAudit({
            businessId,
            userId: (req as AuthenticatedRequest).user?.uid ?? "",
            entity: "businesses",
            action: "update",
            subEntity: businessId,
        });

        res.json(jsonOK({ businessId, isActive }));
    } catch (error) {
        next(error);
    }
};

export const SAdminOverview: RouterService = async (req, res, next) => {
    try {
        const businesses = cacheManager.get("businesses", []) as Business[];
        const users = cacheManager.get("users", []) as User[];
        const usersMap = cacheManager.get("usersMap", new Map());

        const businessRows = businesses.map((b) => {
            const owner = usersMap.get(b.ownerId) as User | undefined;
            return {
                id: b.id,
                name: b.name,
                ownerId: b.ownerId,
                ownerEmail: owner?.email ?? null,
                ownerName: owner ? `${owner.firstName} ${owner.lastName}`.trim() : null,
                phone: b.phone ?? "",
                address: b.address ?? "",
                isActive: b.isActive,
                timezone: b.timezone ?? null,
                created: b.created,
            };
        });

        const userRows = users.map((u) => ({
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            phone: u.phone,
            type: u.type,
            isActive: u.isActive,
            ownedBusinessIds: "ownedBusinessIds" in u ? u.ownedBusinessIds ?? [] : [],
            created: u.created,
        }));

        res.json(jsonOK({ businesses: businessRows, users: userRows }));
    } catch (error) {
        next(error);
    }
};
