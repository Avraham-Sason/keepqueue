import { z } from "zod";

const { object, string, number, boolean } = z;

export const createReviewSchema = object({
    businessId: string().min(1),
    userId: string().min(1),
    calendarEventId: string().min(1).optional(),
    rating: number().int().min(1).max(5),
    text: string().max(2000).optional(),
});

export type CreateReviewModel = z.infer<typeof createReviewSchema>;

export const moderateReviewSchema = object({
    reviewId: string().min(1),
    flagged: boolean(),
});

export type ModerateReviewModel = z.infer<typeof moderateReviewSchema>;
