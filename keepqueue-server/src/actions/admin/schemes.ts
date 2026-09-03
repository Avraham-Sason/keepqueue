import { z } from "zod";

const { object, string, number, boolean, array } = z;

const dailyTimeRangeSchema = object({
    startMin: number().int().min(0).max(1440),
    endMin: number().int().min(0).max(1440),
}).refine((r) => r.endMin > r.startMin, { message: "endMin must be greater than startMin" });

// A literal union rather than number().min(0).max(6) so the parsed type is Weekday itself
// and callers do not have to cast a value zod already narrowed.
const weekdaySchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]);

const operationScheduleSchema = object({
    day: weekdaySchema,
    intervals: array(dailyTimeRangeSchema),
});

export const createUserSchema = object({
    email: string().email().max(254),
    password: string().min(8).max(128),
    firstName: string().min(1).max(100),
    lastName: string().min(1).max(100),
    phone: string().min(7).max(20),
    type: z.enum(["business", "customer"]),
});

export type CreateUserModel = z.infer<typeof createUserSchema>;

export const createBusinessSchema = object({
    name: string().min(2).max(200),
    ownerId: string().min(1),
    phone: string().min(7).max(20).optional(),
    address: string().max(500).optional(),
    categories: array(string().max(60)).max(20).optional(),
    currency: string().max(10).optional(),
    lang: z.enum(["he", "en"]).optional(),
    timezone: string().min(1).max(64).optional(),
    operationSchedule: array(operationScheduleSchema).max(7).optional(),
    isActive: boolean().optional(),
});

export type CreateBusinessModel = z.infer<typeof createBusinessSchema>;

export const setBusinessActiveSchema = object({
    businessId: string().min(1),
    isActive: boolean(),
});

export type SetBusinessActiveModel = z.infer<typeof setBusinessActiveSchema>;
