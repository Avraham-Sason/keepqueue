import { apiCall } from "@/lib/helpers";
import { SetState } from "@/lib/store/utils";
import { BusinessWithRelations, User } from "@/lib/types";

export const getBusinessById = async (businessId: string, signal?: AbortSignal) => {
    return apiCall<BusinessWithRelations>(
        "POST",
        "data",
        `getBusiness`,
        {
            businessId,
        },
        { signal }
    );
};

export const getBusinessByOwnerId = async (ownerId: string, signal?: AbortSignal) => {
    return apiCall<BusinessWithRelations>("POST", "data", `getBusiness`, { ownerId }, { signal });
};
