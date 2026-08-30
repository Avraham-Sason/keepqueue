import { apiCall } from "@/lib/helpers";
import type { CalendarEventStatus } from "@/lib/types";

export const confirmAppointment = async (eventId: string) => {
    return apiCall("POST", "actions", "businesses/appointments/confirm", { calendarEventId: eventId });
};

export const cancelAppointment = async (eventId: string) => {
    return apiCall("POST", "actions", "businesses/appointments/cancel", { calendarEventId: eventId });
};

export const updateAppointmentStatus = async (eventId: string, status: "NO_SHOW" | "DONE") => {
    return apiCall("POST", "actions", "businesses/appointments/updateStatus", { calendarEventId: eventId, status });
};

export const getStatusVariant = (status: CalendarEventStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case "CONFIRMED":
            return "default";
        case "BOOKED":
            return "secondary";
        case "CANCELLED":
            return "destructive";
        case "NO_SHOW":
            return "destructive";
        case "DONE":
            return "outline";
        default:
            return "secondary";
    }
};
