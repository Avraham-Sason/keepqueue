import { jsonFailed, jsonOK } from "../../../helpers";
import { logAudit } from "../../../helpers/audit";
import { RouterService } from "../../../types";
import { db, firebaseTimestamp } from "../../../firebase";
import { FieldValue } from "firebase-admin/firestore";
import { cacheManager } from "../../../managers";
import { BlockCustomerModel, UnblockCustomerModel, UpdateCustomerModel } from "./schemes";

export const SBlockCustomer: RouterService = async (req, res, next) => {
    try {
        const { customerId, businessId } = req.body as BlockCustomerModel;
        const usersMap = cacheManager.get("usersMap", new Map());
        const user = usersMap.get(customerId);
        if (!user) {
            res.json(jsonFailed("Customer not found"));
            return;
        }

        await db.collection("users").doc(customerId).update({
            blockedByBusinessIds: FieldValue.arrayUnion(businessId),
            timestamp: firebaseTimestamp(),
        });

        logAudit({ businessId, userId: customerId, entity: "customers", action: "block", subEntity: customerId });

        res.json(jsonOK({ customerId, businessId }));
    } catch (error) {
        next(error);
    }
};

export const SUnblockCustomer: RouterService = async (req, res, next) => {
    try {
        const { customerId, businessId } = req.body as UnblockCustomerModel;
        const usersMap = cacheManager.get("usersMap", new Map());
        const user = usersMap.get(customerId);
        if (!user) {
            res.json(jsonFailed("Customer not found"));
            return;
        }

        await db.collection("users").doc(customerId).update({
            blockedByBusinessIds: FieldValue.arrayRemove(businessId),
            timestamp: firebaseTimestamp(),
        });

        logAudit({ businessId, userId: customerId, entity: "customers", action: "unblock", subEntity: customerId });

        res.json(jsonOK({ customerId, businessId }));
    } catch (error) {
        next(error);
    }
};

export const SUpdateCustomer: RouterService = async (req, res, next) => {
    try {
        const { customerId, ...updates } = req.body as UpdateCustomerModel;
        const usersMap = cacheManager.get("usersMap", new Map());
        const user = usersMap.get(customerId);
        if (!user) {
            res.json(jsonFailed("Customer not found"));
            return;
        }

        const updateData: any = { ...updates, timestamp: firebaseTimestamp() };
        await db.collection("users").doc(customerId).update(updateData);
        res.json(jsonOK({ customerId }));
    } catch (error) {
        next(error);
    }
};
