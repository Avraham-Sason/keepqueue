import { z } from "zod";

const { object, string, number } = z;

export const addToWaitlistSchema = object({
    businessId: string().min(1),
    userId: string().min(1),
    serviceId: string().min(1),
    preferredWindow: object({
        from: number().int().positive(),
        to: number().int().positive(),
    }),
    priority: number().int().min(0).optional(),
});

export type AddToWaitlistModel = z.infer<typeof addToWaitlistSchema>;

export const deleteFromWaitlistSchema = object({
    waitItemId: string().min(1),
});

export type DeleteFromWaitlistModel = z.infer<typeof deleteFromWaitlistSchema>;
