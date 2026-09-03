import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/hooks";
import type { CalendarEventStatus, CalendarEventWithRelations } from "@/lib/types";
import { cancelAppointment, confirmAppointment, updateAppointmentStatus } from "./helpers";
import { useRefreshBusiness } from "../hooks";

export function useAppointments(calendar: CalendarEventWithRelations[]) {
    const [statusFilter, setStatusFilter] = useState<CalendarEventStatus | "ALL">("ALL");
    const [serviceFilter, setServiceFilter] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const refreshBusiness = useRefreshBusiness();

    const filteredAppointments = useMemo(() => {
        let filtered = calendar.filter((event) => event.type === "APPOINTMENT");

        if (statusFilter !== "ALL") {
            filtered = filtered.filter((event) => event.status === statusFilter);
        }

        if (serviceFilter !== "ALL") {
            filtered = filtered.filter((event) => event.serviceId === serviceFilter);
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter((event) => {
                const userName = `${event.user?.firstName || ""} ${event.user?.lastName || ""}`.toLowerCase();
                const serviceName = (event.service?.name || "").toLowerCase();
                return userName.includes(q) || serviceName.includes(q) || event.title.toLowerCase().includes(q);
            });
        }

        filtered.sort((a, b) => {
            const aTime = a.start && "seconds" in a.start ? a.start.seconds : 0;
            const bTime = b.start && "seconds" in b.start ? b.start.seconds : 0;
            return bTime - aTime;
        });

        return filtered;
    }, [calendar, statusFilter, serviceFilter, searchQuery]);

    return {
        filteredAppointments,
        statusFilter,
        setStatusFilter,
        serviceFilter,
        setServiceFilter,
        searchQuery,
        setSearchQuery,
    };
}

export function useAppointmentActions() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [cancelDialogEventId, setCancelDialogEventId] = useState<string | null>(null);
    const refreshBusiness = useRefreshBusiness();
    const { t } = useLanguage();

    // Every one of these used to swallow its failure into console.error: the button re-enabled,
    // nothing changed, and the owner had no way to tell a refused action from a slow one. The
    // server now answers 4xx with a message written for the caller, so show it.
    const run = async (action: () => Promise<unknown>, successKey: string, onDone?: () => void) => {
        setIsProcessing(true);
        try {
            await action();
            toast.success(t(successKey));
            onDone?.();
            await refreshBusiness();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : t("errorGeneric"));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirm = (eventId: string) => run(() => confirmAppointment(eventId), "appointmentConfirmed");

    const handleCancel = (eventId: string) => run(() => cancelAppointment(eventId), "appointmentCancelled", () => setCancelDialogEventId(null));

    const handleMarkNoShow = (eventId: string) => run(() => updateAppointmentStatus(eventId, "NO_SHOW"), "appointmentMarkedNoShow");

    const handleMarkDone = (eventId: string) => run(() => updateAppointmentStatus(eventId, "DONE"), "appointmentMarkedDone");

    return {
        isProcessing,
        cancelDialogEventId,
        setCancelDialogEventId,
        handleConfirm,
        handleCancel,
        handleMarkNoShow,
        handleMarkDone,
    };
}
