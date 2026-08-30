import { z } from "zod";

const { object, string, array, any } = z;

export const getCollectionSchema = object({
    collectionName: string().min(4).max(20),
    conditions: array(
        object({
            fieldName: string(),
            operator: z.enum(["==", "!=", ">", ">=", "<", "<=", "in", "not-in", "array-contains"]),
            value: any(),
        })
    ).optional(),
    conditionsType: z.enum(["and", "or"]).optional(),
});

export type GetCollectionModel = z.infer<typeof getCollectionSchema>;

export const getBusinessSchema = object({
    businessId: string().optional(),
    ownerId: string().optional(),
});

export type GetBusinessModel = z.infer<typeof getBusinessSchema>;

export const getAvailabilityByServiceIdSchema = object({
    serviceId: string().min(5),
});

export type GetAvailabilityByServiceIdModel = z.infer<typeof getAvailabilityByServiceIdSchema>;

export const getBusinessCustomersSchema = object({
    businessId: string().min(5),
});

export type GetBusinessCustomersModel = z.infer<typeof getBusinessCustomersSchema>;

export const getUserByIdSchema = object({
    userId: string().min(5),
});

export type GetUserByIdModel = z.infer<typeof getUserByIdSchema>;

export const getBusinessStaffSchema = object({
    businessId: string().min(1),
});

export type GetBusinessStaffModel = z.infer<typeof getBusinessStaffSchema>;

export const getBusinessWaitlistSchema = object({
    businessId: string().min(1),
});

export type GetBusinessWaitlistModel = z.infer<typeof getBusinessWaitlistSchema>;

export const getBusinessReviewsSchema = object({
    businessId: string().min(1),
});

export type GetBusinessReviewsModel = z.infer<typeof getBusinessReviewsSchema>;

export const getBusinessRatingsSchema = object({
    businessId: string().min(1),
});

export type GetBusinessRatingsModel = z.infer<typeof getBusinessRatingsSchema>;

export const getBusinessAppointmentsSchema = object({
    businessId: string().min(1),
    fromDate: z.number().int().positive().optional(),
    toDate: z.number().int().positive().optional(),
    status: z.enum(["BOOKED", "CONFIRMED", "CANCELLED", "NO_SHOW", "DONE"]).optional(),
    serviceId: string().optional(),
});

export type GetBusinessAppointmentsModel = z.infer<typeof getBusinessAppointmentsSchema>;

export const getBusinessAnalyticsSchema = object({
    businessId: string().min(1),
    periodDays: z.number().int().min(1).max(365).optional(),
});

export type GetBusinessAnalyticsModel = z.infer<typeof getBusinessAnalyticsSchema>;