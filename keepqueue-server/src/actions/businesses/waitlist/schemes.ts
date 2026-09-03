import { z } from "zod";

const { object, string, number } = z;

export const addToWaitlistSchema = object({
    businessId: string().min(1),
    userId: string().min(1),
    serviceId: string().min(1),
    preferredWindow: object({
        from: number().int().positive(),
        to: number().int().positive(),
    }).refine((w) => w.to > w.from, { path: ["to"], message: "the window must end after it starts" }),
    // priority is deliberately not accepted from the request. It used to be, which let a
    // customer send 999999 and jump the queue they were waiting in.
});

export type AddToWaitlistModel = z.infer<typeof addToWaitlistSchema>;

export const deleteFromWaitlistSchema = object({
    waitItemId: string().min(1),
});

export type DeleteFromWaitlistModel = z.infer<typeof deleteFromWaitlistSchema>;
