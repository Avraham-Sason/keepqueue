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

export const createStaffSchema = object({
    businessId: string().min(1),
    firstName: string().min(1).max(100),
    lastName: string().min(1).max(100),
    role: z.enum(["owner", "manager", "employee"]),
    isActive: boolean().optional(),
    operationSchedule: array(operationScheduleSchema).optional(),
    serviceIds: array(string()).optional(),
    email: string().email().optional(),
    phone: string().max(20).optional(),
    photoURL: string().url().optional(),
    color: string().max(20).optional(),
    notes: string().max(2000).optional(),
});

export type CreateStaffModel = z.infer<typeof createStaffSchema>;

export const updateStaffSchema = object({
    staffId: string().min(1),
    firstName: string().min(1).max(100).optional(),
    lastName: string().min(1).max(100).optional(),
    role: z.enum(["owner", "manager", "employee"]).optional(),
    isActive: boolean().optional(),
    operationSchedule: array(operationScheduleSchema).optional(),
    serviceIds: array(string()).optional(),
    email: string().email().optional(),
    phone: string().max(20).optional(),
    photoURL: string().url().optional(),
    color: string().max(20).optional(),
    notes: string().max(2000).optional(),
});

export type UpdateStaffModel = z.infer<typeof updateStaffSchema>;

export const deleteStaffSchema = object({
    staffId: string().min(1),
});

export type DeleteStaffModel = z.infer<typeof deleteStaffSchema>;
