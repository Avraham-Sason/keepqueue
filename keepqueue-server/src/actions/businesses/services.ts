import { jsonFailed, jsonOK } from "../../helpers";
import { RouterService } from "../../types";
import { db, firebaseTimestamp } from "../../firebase";
import { cacheManager } from "../../managers";
import { UpdateBusinessModel } from "./schemes";

export const SUpdateBusiness: RouterService = async (req, res, next) => {
    try {
        const { businessId, ...updates } = req.body as UpdateBusinessModel;
        const businessesMap = cacheManager.get("businessesMap", new Map());
        const existing = businessesMap.get(businessId);
        if (!existing) {
            res.json(jsonFailed("Business not found"));
            return;
        }

        const updateData: any = { ...updates, timestamp: firebaseTimestamp() };
        await db.collection("businesses").doc(businessId).update(updateData);
        res.json(jsonOK({ businessId }));
    } catch (error) {
        next(error);
    }
};
