import { apiCall } from "@/lib/helpers";
import type { CalendarEventStatus, CalendarEventType } from "@/lib/types";

export const confirmAppointment = async (eventId: string) => {
    return apiCall("POST", "actions", "businesses/appointments/confirm", { calendarEventId: eventId });
};

export const cancelAppointment = async (eventId: string) => {
    return apiCall("POST", "actions", "businesses/appointments/cancel", { calendarEventId: eventId });
};

export const rescheduleAppointment = async (eventId: string, startMillis: number, endMillis: number, notes?: string) => {
    return apiCall("POST", "actions", "businesses/appointments/reschedule", { calendarEventId: eventId, start: startMillis, end: endMillis, notes });
};

interface CreateCalendarEventPayload {
    businessId: string;
    userId: string;
    type: CalendarEventType;
    startMillis: number;
    endMillis: number;
    serviceId?: string;
    notes?: string;
}

export const createCalendarEvent = async ({ startMillis, endMillis, ...rest }: CreateCalendarEventPayload) => {
    return apiCall("POST", "actions", "businesses/appointments/create", { ...rest, start: startMillis, end: endMillis, source: "admin" });
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
