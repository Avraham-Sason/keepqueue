import { jsonFailed, jsonOK } from "../../../helpers";
import { OperationSchedule, RouterService, Service } from "../../../types";
import { db, firebaseTimestamp } from "../../../firebase";
import { cacheManager } from "../../../managers";
import { CreateServiceModel, UpdateServiceModel, DeleteServiceModel } from "./schemes";

export const SCreateService: RouterService = async (req, res, next) => {
    try {
        const body = req.body as CreateServiceModel;
        const newRef = db.collection("services").doc();
        const serviceDoc: Service = {
            id: newRef.id,
            businessId: body.businessId,
            name: body.name,
            durationMin: body.durationMin,
            price: body.price,
            operationSchedule: (body.operationSchedule || []) as OperationSchedule[],
            paddingBefore: body.paddingBefore || 0,
            paddingAfter: body.paddingAfter || 0,
            active: body.active !== undefined ? body.active : true,
            order: body.order || 0,
            created: firebaseTimestamp(),
            timestamp: firebaseTimestamp(),
        };
        await newRef.set(serviceDoc);
        res.json(jsonOK({ serviceId: newRef.id }));
    } catch (error) {
        next(error);
    }
};

export const SUpdateService: RouterService = async (req, res, next) => {
    try {
        const { serviceId, ...updates } = req.body as UpdateServiceModel;
        const servicesMap = cacheManager.get("servicesMap", new Map());
        const existing = servicesMap.get(serviceId);
        if (!existing) {
            res.json(jsonFailed("Service not found"));
            return;
        }

        const updateData: any = { ...updates, timestamp: firebaseTimestamp() };
        await db.collection("services").doc(serviceId).update(updateData);
        res.json(jsonOK({ serviceId }));
    } catch (error) {
        next(error);
    }
};

export const SDeleteService: RouterService = async (req, res, next) => {
    try {
        const { serviceId } = req.body as DeleteServiceModel;
        const servicesMap = cacheManager.get("servicesMap", new Map());
        const existing = servicesMap.get(serviceId);
        if (!existing) {
            res.json(jsonFailed("Service not found"));
            return;
        }

        await db.collection("services").doc(serviceId).delete();
        res.json(jsonOK({ serviceId }));
    } catch (error) {
        next(error);
    }
};
