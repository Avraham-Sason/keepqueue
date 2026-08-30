import { useMemo, useState } from "react";
import type { CalendarEventWithRelations } from "@/lib/types/business";
import type { Service } from "@/lib/types";

export type Period = "7" | "30" | "90";

export function useAnalytics(calendar: CalendarEventWithRelations[], services: Service[]) {
    const [period, setPeriod] = useState<Period>("30");

    const stats = useMemo(() => {
        const now = Date.now();
        const periodMs = parseInt(period) * 24 * 60 * 60 * 1000;
        const cutoff = now - periodMs;

        const appointments = calendar.filter((e) => {
            if (e.type !== "APPOINTMENT") return false;
            const ts = e.start && "seconds" in e.start ? e.start.seconds * 1000 : 0;
            return ts >= cutoff;
        });

        const totalBookings = appointments.length;
        const noShows = appointments.filter((e) => e.status === "NO_SHOW").length;
        const cancellations = appointments.filter((e) => e.status === "CANCELLED").length;
        const completed = appointments.filter((e) => e.status === "DONE" || e.status === "CONFIRMED").length;
        const noShowRate = totalBookings > 0 ? Math.round((noShows / totalBookings) * 100) : 0;
        const cancellationRate = totalBookings > 0 ? Math.round((cancellations / totalBookings) * 100) : 0;

        const revenueByService: Record<string, { name: string; revenue: number; count: number }> = {};
        appointments
            .filter((e) => e.status === "DONE" || e.status === "CONFIRMED")
            .forEach((e) => {
                const svc = services.find((s) => s.id === e.serviceId);
                if (svc) {
                    if (!revenueByService[svc.id!]) {
                        revenueByService[svc.id!] = { name: svc.name, revenue: 0, count: 0 };
                    }
                    revenueByService[svc.id!].revenue += svc.price;
                    revenueByService[svc.id!].count++;
                }
            });

        const topServices = Object.values(revenueByService)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const totalRevenue = Object.values(revenueByService).reduce((acc, s) => acc + s.revenue, 0);

        const bookingsByDay: Record<string, number> = {};
        appointments.forEach((e) => {
            const ts = e.start && "seconds" in e.start ? e.start.seconds * 1000 : 0;
            const day = new Date(ts).toISOString().split("T")[0];
            bookingsByDay[day] = (bookingsByDay[day] || 0) + 1;
        });

        return {
            totalBookings,
            noShows,
            cancellations,
            completed,
            noShowRate,
            cancellationRate,
            topServices,
            totalRevenue,
            bookingsByDay,
        };
    }, [calendar, services, period]);

    return { ...stats, period, setPeriod };
}
