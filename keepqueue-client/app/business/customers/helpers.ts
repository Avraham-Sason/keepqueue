import { apiCall } from "@/lib/helpers";
import { User } from "@/lib/types";

export const formatCustomerName = (customer: { firstName?: string; lastName?: string; email?: string }) => {
    const firstName = customer.firstName || "";
    const lastName = customer.lastName || "";
    if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
    }
    return customer.email || "Unknown Customer";
};

export const getCustomerInitials = (customer: { firstName?: string; lastName?: string; email?: string }) => {
    const firstName = customer.firstName || "";
    const lastName = customer.lastName || "";
    if (firstName || lastName) {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return (customer.email || "U").charAt(0).toUpperCase();
};

export const getUserById = async (userId: string, signal?: AbortSignal) => {
    return apiCall<User>(
        "POST",
        "data",
        `getUserById`,
        {
            userId,
        },
        { signal }
    );
};