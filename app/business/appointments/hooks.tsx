import { useState, useMemo } from "react";
import type { CalendarEventStatus, CalendarEventWithRelations } from "@/lib/types";
import { confirmAppointment, cancelAppointment } from "./helpers";
import { useRefreshBusiness } from "../hooks";
import { setDocument } from "@/lib/firebase";

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

    const handleConfirm = async (eventId: string) => {
        setIsProcessing(true);
        try {
            await confirmAppointment(eventId);
            refreshBusiness();
        } catch (error) {
            console.error("Error confirming appointment:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = async (eventId: string) => {
        setIsProcessing(true);
        try {
            await cancelAppointment(eventId);
            setCancelDialogEventId(null);
            refreshBusiness();
        } catch (error) {
            console.error("Error cancelling appointment:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMarkNoShow = async (eventId: string) => {
        setIsProcessing(true);
        try {
            await setDocument("calendar", eventId, { status: "NO_SHOW" });
            refreshBusiness();
        } catch (error) {
            console.error("Error marking no-show:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleMarkDone = async (eventId: string) => {
        setIsProcessing(true);
        try {
            await setDocument("calendar", eventId, { status: "DONE" });
            refreshBusiness();
        } catch (error) {
            console.error("Error marking done:", error);
        } finally {
            setIsProcessing(false);
        }
    };

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
