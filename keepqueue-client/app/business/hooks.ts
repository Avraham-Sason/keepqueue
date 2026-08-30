"use client";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore, useBusinessesStore } from "@/lib/store";
import { getBusinessById, getBusinessByOwnerId } from "./helpers";
import { useRouter, usePathname } from "next/navigation";
import { BusinessOwner } from "@/lib/types";

export const useBusiness = (businessId?: string) => {
    const user = useAuthStore.user();
    const isBusinessOwner = useAuthStore.isBusinessOwner();
    const setCurrentBusiness = useBusinessesStore.setCurrentBusiness();
    const finalBusinessId = businessId || isBusinessOwner ? (user as BusinessOwner)?.ownedBusinessIds?.[0] : "";

    const queryKey = ["business", finalBusinessId];

    const { data: queryData, isLoading } = useQuery({
        queryKey,
        queryFn: async (context) => {
            if (!finalBusinessId) {
                return;
            }
            console.log("⚡ fetching business", {
                queryKey: queryKey[1],
                timestamp: Date.now(),
                isAborted: context.signal.aborted,
            });

            const business = await getBusinessById(finalBusinessId, context.signal);
            return business;
        },
        enabled: !!finalBusinessId,
        refetchInterval: 10 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
    });

    // Update Zustand store when query data changes
    useEffect(() => {
        if (queryData) {
            setCurrentBusiness(queryData);
        }
    }, [queryData, setCurrentBusiness]);

    return queryData;
};

export function useRefreshBusiness() {
    const queryClient = useQueryClient();
    const currentBusiness = useBusinessesStore.currentBusiness();

    return () => {
        if (!currentBusiness) return;
        const queryKey = ["business", currentBusiness.id];
        return queryClient.refetchQueries({
            queryKey,
            exact: true,
        });
    };
}

export const useBusinessProxy = () => {
    const currentBusiness = useBusinessesStore.currentBusiness();
    const router = useRouter();
    const pathname = usePathname();
    useEffect(() => {
        if (!currentBusiness) return;
        if (pathname === "/business") {
            router.replace(`/business/dashboard`);
        }
    }, [currentBusiness?.id, pathname]);
};
