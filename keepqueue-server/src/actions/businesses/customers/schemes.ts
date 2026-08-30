import { z } from "zod";

const { object, string } = z;

export const blockCustomerSchema = object({
    customerId: string().min(1),
    businessId: string().min(1),
});

export type BlockCustomerModel = z.infer<typeof blockCustomerSchema>;

export const unblockCustomerSchema = object({
    customerId: string().min(1),
    businessId: string().min(1),
});

export type UnblockCustomerModel = z.infer<typeof unblockCustomerSchema>;

export const updateCustomerSchema = object({
    businessId: string().min(1),
    customerId: string().min(1),
    notes: string().max(2000).optional(),
    phone: string().max(20).optional(),
    firstName: string().max(100).optional(),
    lastName: string().max(100).optional(),
});

export type UpdateCustomerModel = z.infer<typeof updateCustomerSchema>;
