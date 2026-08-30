import { z } from "zod";

const { object, string, number, boolean, array } = z;

const dailyTimeRangeSchema = object({
    startMin: number().int().min(0).max(1440),
    endMin: number().int().min(0).max(1440),
});

const operationScheduleSchema = object({
    day: number().int().min(0).max(6),
    intervals: array(dailyTimeRangeSchema),
});

const policySchema = object({
    cancellationWindowMin: number().int().min(0).optional(),
    lateThresholdMin: number().int().min(0).optional(),
    noShowAutoBlock: boolean().optional(),
    noShowLimit: number().int().min(0).optional(),
});

export const updateBusinessSchema = object({
    businessId: string().min(1),
    name: string().min(1).max(200).optional(),
    phone: string().max(20).optional(),
    address: string().max(500).optional(),
    categories: array(string()).optional(),
    operationSchedule: array(operationScheduleSchema).optional(),
    currency: string().max(10).optional(),
    lang: z.enum(["he", "en"]).optional(),
    logoUrl: string().optional(),
    policy: policySchema.optional(),
    isActive: boolean().optional(),
});

export type UpdateBusinessModel = z.infer<typeof updateBusinessSchema>;
