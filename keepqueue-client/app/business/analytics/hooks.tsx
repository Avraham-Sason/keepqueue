import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiCall } from "@/lib/helpers";

export type Period = "7" | "30" | "90";

interface AnalyticsTopService {
    serviceId: string;
    serviceName: string;
    bookings: number;
    revenue: number;
}

interface BusinessAnalytics {
    periodDays: number;
    totalBookings: number;
    completed: number;
    noShows: number;
    cancellations: number;
    noShowRate: number;
    cancellationRate: number;
    totalRevenue: number;
    topServices: AnalyticsTopService[];
}

/**
 * The numbers come from /data/getBusinessAnalytics rather than from the calendar in the store.
 * Recomputing them here meant a second definition of "revenue" and "in period" that drifted from
 * the server's, and it could not read Admin-SDK timestamps ({_seconds}) in the first place.
 */
export function useAnalytics(businessId?: string) {
    const [period, setPeriod] = useState<Period>("30");

    const { data, isLoading, isError } = useQuery({
        queryKey: ["businessAnalytics", businessId, period],
        queryFn: () => apiCall<BusinessAnalytics>("POST", "data", "getBusinessAnalytics", { businessId, periodDays: Number(period) }),
        enabled: !!businessId,
        refetchOnWindowFocus: false,
    });

    return {
        totalBookings: data?.totalBookings ?? 0,
        completed: data?.completed ?? 0,
        noShows: data?.noShows ?? 0,
        cancellations: data?.cancellations ?? 0,
        noShowRate: data?.noShowRate ?? 0,
        cancellationRate: data?.cancellationRate ?? 0,
        totalRevenue: data?.totalRevenue ?? 0,
        topServices: (data?.topServices ?? []).slice(0, 5).map((service) => ({
            name: service.serviceName,
            revenue: service.revenue,
            count: service.bookings,
        })),
        isLoading,
        isError,
        period,
        setPeriod,
    };
}
