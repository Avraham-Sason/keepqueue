import { jsonFailed, jsonOK } from "../../../helpers";
import { RouterService, WaitItem } from "../../../types";
import { db, firebaseTimestamp } from "../../../firebase";
import { Timestamp } from "firebase-admin/firestore";
import { cacheManager } from "../../../managers";
import { AddToWaitlistModel, DeleteFromWaitlistModel } from "./schemes";

const DEFAULT_WAITLIST_TTL_DAYS = 30;

export const SAddToWaitlist: RouterService = async (req, res, next) => {
    try {
        const body = req.body as AddToWaitlistModel;

        // None of this was checked: a waitlist row could name a business that does not exist, a
        // service belonging to somebody else, or a window already in the past, and one customer
        // could queue for the same service without limit.
        const business = (cacheManager.get("businessesMap", new Map()) as Map<string, any>).get(body.businessId);
        if (!business) {
            res.status(404).json(jsonFailed("Business not found"));
            return;
        }
        const service = (cacheManager.get("servicesMap", new Map()) as Map<string, any>).get(body.serviceId);
        if (!service || service.businessId !== body.businessId || service.active === false) {
            res.status(422).json(jsonFailed("That service is not available at this business"));
            return;
        }
        if (body.preferredWindow.to <= Date.now()) {
            res.status(422).json(jsonFailed("The preferred window has already passed"));
            return;
        }
        const existing = (cacheManager.get("waitlist", []) as WaitItem[]).some(
            (item) => item.userId === body.userId && item.serviceId === body.serviceId && item.expiresAt.toMillis() > Date.now(),
        );
        if (existing) {
            res.status(409).json(jsonFailed("You are already on the waiting list for this service"));
            return;
        }

        const newRef = db.collection("waitlist").doc();

        const expiresAt = Timestamp.fromMillis(Date.now() + DEFAULT_WAITLIST_TTL_DAYS * 24 * 60 * 60 * 1000);

        const waitItemDoc: WaitItem = {
            id: newRef.id,
            businessId: body.businessId,
            userId: body.userId,
            serviceId: body.serviceId,
            preferredWindow: {
                from: Timestamp.fromMillis(body.preferredWindow.from),
                to: Timestamp.fromMillis(body.preferredWindow.to),
            },
            priority: 0,
            expiresAt,
            created: firebaseTimestamp(),
            timestamp: firebaseTimestamp(),
        };

        await newRef.set(waitItemDoc);
        res.json(jsonOK({ waitItemId: newRef.id }));
    } catch (error) {
        next(error);
    }
};

export const SDeleteFromWaitlist: RouterService = async (req, res, next) => {
    try {
        const { waitItemId } = req.body as DeleteFromWaitlistModel;
        const waitlistMap = cacheManager.get("waitlistMap", new Map());
        const existing = waitlistMap.get(waitItemId);
        if (!existing) {
            res.json(jsonFailed("Waitlist item not found"));
            return;
        }

        await db.collection("waitlist").doc(waitItemId).delete();
        res.json(jsonOK({ waitItemId }));
    } catch (error) {
        next(error);
    }
};
