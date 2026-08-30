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

export const createServiceSchema = object({
    businessId: string().min(1),
    name: string().min(1).max(200),
    durationMin: number().int().positive(),
    price: number().min(0),
    operationSchedule: array(operationScheduleSchema).optional(),
    paddingBefore: number().int().min(0).optional(),
    paddingAfter: number().int().min(0).optional(),
    active: boolean().optional(),
    order: number().int().min(0).optional(),
});

export type CreateServiceModel = z.infer<typeof createServiceSchema>;

export const updateServiceSchema = object({
    serviceId: string().min(1),
    name: string().min(1).max(200).optional(),
    durationMin: number().int().positive().optional(),
    price: number().min(0).optional(),
    operationSchedule: array(operationScheduleSchema).optional(),
    paddingBefore: number().int().min(0).optional(),
    paddingAfter: number().int().min(0).optional(),
    active: boolean().optional(),
    order: number().int().min(0).optional(),
});

export type UpdateServiceModel = z.infer<typeof updateServiceSchema>;

export const deleteServiceSchema = object({
    serviceId: string().min(1),
});

export type DeleteServiceModel = z.infer<typeof deleteServiceSchema>;
