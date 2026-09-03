import { apiCall } from "@/lib/helpers";
import { Business } from "@/lib/types";

export type AdminUserType = "business" | "customer";

export type AdminBusinessRow = {
    id: string;
    name: string;
    ownerId: string;
    ownerEmail: string | null;
    ownerName: string | null;
    phone: string;
    address: string;
    isActive: boolean;
    timezone: string | null;
    created: any;
};

export type AdminUserRow = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    type: AdminUserType | "admin";
    isActive: boolean;
    ownedBusinessIds: string[];
    created: any;
};

export type AdminOverview = {
    businesses: AdminBusinessRow[];
    users: AdminUserRow[];
};

export type CreateAdminUserPayload = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    type: AdminUserType;
};

export type CreateAdminBusinessPayload = {
    name: string;
    ownerId: string;
    phone?: string;
    address?: string;
};

export const getAdminOverview = async (signal?: AbortSignal) => {
    return apiCall<AdminOverview>("POST", "actions", `admin/overview`, undefined, { signal });
};

export const createAdminUser = async (payload: CreateAdminUserPayload) => {
    return apiCall<{ userId: string; email: string; type: AdminUserType }>("POST", "actions", `admin/users/create`, payload);
};

export const createAdminBusiness = async (payload: CreateAdminBusinessPayload) => {
    return apiCall<Business>("POST", "actions", `admin/businesses/create`, payload);
};

export const setAdminBusinessActive = async (businessId: string, isActive: boolean) => {
    return apiCall<{ businessId: string; isActive: boolean }>("POST", "actions", `admin/businesses/setActive`, {
        businessId,
        isActive,
    });
};

export const MAX_LENGTHS = {
    email: 254,
    password: 128,
    name: 100,
    phone: 20,
    businessName: 200,
    address: 500,
} as const;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FieldErrors = Record<string, string>;

export const validateCreateUser = (form: CreateAdminUserPayload): FieldErrors => {
    const errors: FieldErrors = {};
    if (!emailPattern.test(form.email.trim())) errors.email = "adminErrorEmail";
    if (form.password.length < 8) errors.password = "adminErrorPassword";
    if (!form.firstName.trim()) errors.firstName = "adminErrorFirstName";
    if (!form.lastName.trim()) errors.lastName = "adminErrorLastName";
    if (form.phone.trim().length < 7) errors.phone = "adminErrorPhone";
    return errors;
};

export const validateCreateBusiness = (form: CreateAdminBusinessPayload): FieldErrors => {
    const errors: FieldErrors = {};
    if (form.name.trim().length < 2) errors.name = "adminErrorBusinessName";
    if (!form.ownerId) errors.ownerId = "adminErrorOwnerRequired";
    if (form.phone && form.phone.trim().length < 7) errors.phone = "adminErrorPhone";
    return errors;
};
