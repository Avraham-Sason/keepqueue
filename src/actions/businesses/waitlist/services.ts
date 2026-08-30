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
            priority: body.priority || 0,
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
