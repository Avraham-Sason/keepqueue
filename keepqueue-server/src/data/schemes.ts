import { z } from "zod";

const { object, string } = z;

export const getMyAppointmentsSchema = object({
    businessId: string().min(5).optional(),
});

export type GetMyAppointmentsModel = z.infer<typeof getMyAppointmentsSchema>;

export const getBusinessSchema = object({
    businessId: string().optional(),
    ownerId: string().optional(),
});

export type GetBusinessModel = z.infer<typeof getBusinessSchema>;

export const getAvailabilityByServiceIdSchema = object({
    serviceId: string().min(5),
    staffId: string().min(1).optional(),
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

export const searchBusinessesSchema = object({
    query: string().max(120).optional(),
    category: string().max(60).optional(),
    limit: z.number().int().min(1).max(60).optional(),
});

export type SearchBusinessesModel = z.infer<typeof searchBusinessesSchema>;
