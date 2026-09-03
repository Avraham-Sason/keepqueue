"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useLanguage } from "@/hooks";
import {
    createAdminBusiness,
    createAdminUser,
    getAdminOverview,
    setAdminBusinessActive,
    type CreateAdminBusinessPayload,
    type CreateAdminUserPayload,
} from "./helpers";

const overviewQueryKey = ["admin", "overview"];

const messageOf = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

export function useAdminOverview() {
    return useQuery({
        queryKey: overviewQueryKey,
        queryFn: (context) => getAdminOverview(context.signal),
        refetchOnWindowFocus: false,
        retry: 1,
    });
}

function useRefreshOverview() {
    const queryClient = useQueryClient();
    return () => queryClient.refetchQueries({ queryKey: overviewQueryKey, exact: true });
}

export function useCreateUser() {
    const { t } = useLanguage();
    const refreshOverview = useRefreshOverview();

    return useMutation({
        mutationFn: (payload: CreateAdminUserPayload) => createAdminUser(payload),
        onSuccess: async () => {
            toast.success(t("adminUserCreated"));
            await refreshOverview();
        },
        onError: (error) => toast.error(messageOf(error, t("adminGenericError"))),
    });
}

export function useCreateBusiness() {
    const { t } = useLanguage();
    const refreshOverview = useRefreshOverview();

    return useMutation({
        mutationFn: (payload: CreateAdminBusinessPayload) => createAdminBusiness(payload),
        onSuccess: async () => {
            toast.success(t("adminBusinessCreated"));
            await refreshOverview();
        },
        onError: (error) => toast.error(messageOf(error, t("adminGenericError"))),
    });
}

export function useSetBusinessActive() {
    const { t } = useLanguage();
    const refreshOverview = useRefreshOverview();

    return useMutation({
        mutationFn: (variables: { businessId: string; isActive: boolean }) =>
            setAdminBusinessActive(variables.businessId, variables.isActive),
        onSuccess: async (_data, variables) => {
            toast.success(t(variables.isActive ? "adminBusinessActivated" : "adminBusinessDeactivated"));
            await refreshOverview();
        },
        onError: (error) => toast.error(messageOf(error, t("adminGenericError"))),
    });
}
