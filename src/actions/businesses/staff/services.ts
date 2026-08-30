import { jsonFailed, jsonOK } from "../../../helpers";
import { OperationSchedule, RouterService, StaffMember } from "../../../types";
import { db, firebaseTimestamp } from "../../../firebase";
import { cacheManager } from "../../../managers";
import { CreateStaffModel, UpdateStaffModel, DeleteStaffModel } from "./schemes";

export const SCreateStaff: RouterService = async (req, res, next) => {
    try {
        const body = req.body as CreateStaffModel;
        const newRef = db.collection("staff").doc();
        const staffDoc: StaffMember = {
            id: newRef.id,
            businessId: body.businessId,
            firstName: body.firstName,
            lastName: body.lastName,
            role: body.role,
            isActive: body.isActive !== undefined ? body.isActive : true,
            operationSchedule: (body.operationSchedule || []) as OperationSchedule[],
            serviceIds: body.serviceIds || [],
            email: body.email || "",
            phone: body.phone || "",
            photoURL: body.photoURL || "",
            color: body.color || "",
            notes: body.notes || "",
            created: firebaseTimestamp(),
            timestamp: firebaseTimestamp(),
        };
        await newRef.set(staffDoc);
        res.json(jsonOK({ staffId: newRef.id }));
    } catch (error) {
        next(error);
    }
};

export const SUpdateStaff: RouterService = async (req, res, next) => {
    try {
        const { staffId, ...updates } = req.body as UpdateStaffModel;
        const staffMap = cacheManager.get("staffMap", new Map());
        const existing = staffMap.get(staffId);
        if (!existing) {
            res.json(jsonFailed("Staff member not found"));
            return;
        }

        const updateData: any = { ...updates, timestamp: firebaseTimestamp() };
        await db.collection("staff").doc(staffId).update(updateData);
        res.json(jsonOK({ staffId }));
    } catch (error) {
        next(error);
    }
};

export const SDeleteStaff: RouterService = async (req, res, next) => {
    try {
        const { staffId } = req.body as DeleteStaffModel;
        const staffMap = cacheManager.get("staffMap", new Map());
        const existing = staffMap.get(staffId);
        if (!existing) {
            res.json(jsonFailed("Staff member not found"));
            return;
        }

        await db.collection("staff").doc(staffId).delete();
        res.json(jsonOK({ staffId }));
    } catch (error) {
        next(error);
    }
};
