import { db, firebaseTimestamp } from "../firebase";
import { Audit } from "../types";
import { logger } from "../managers";

export const logAudit = async (params: {
    businessId: string;
    userId: string;
    entity: Audit["entity"];
    action: Audit["action"];
    subEntity: string;
}): Promise<void> => {
    try {
        const newRef = db.collection("audits").doc();
        const auditDoc: Audit = {
            id: newRef.id,
            businessId: params.businessId,
            userId: params.userId,
            entity: params.entity,
            action: params.action,
            subEntity: params.subEntity,
            created: firebaseTimestamp(),
            timestamp: firebaseTimestamp(),
        };
        await newRef.set(auditDoc);
    } catch (error) {
        // Don't fail the main operation if audit logging fails
        logger.error("Audit log failed:", error);
    }
};
