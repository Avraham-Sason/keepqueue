"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import moment from "moment-timezone";
import { EventCalendar } from "@/components/CalendarComponent";
import type { CalendarEvent as UiCalendarEvent, EventColor } from "@/components/CalendarComponent";
import { useBusinessesStore, useSettingsStore } from "@/lib/store";
import { timestampToMillis } from "@/lib/helpers";
import type { CalendarEventStatus, CalendarEventType, CalendarEventWithRelations } from "@/lib/types";
import BusinessLoading from "../loading";
import { useLanguage } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays, Palmtree } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRefreshBusiness } from "../hooks";
import { cancelAppointment, createCalendarEvent, rescheduleAppointment } from "../appointments/helpers";
import { useAuthStore } from "@/lib/store";

type BlockType = Exclude<CalendarEventType, "APPOINTMENT">;

const statusColorByStatus: Record<CalendarEventStatus, EventColor> = {
    BOOKED: "primary",
    CONFIRMED: "sky",
    CANCELLED: "rose",
    NO_SHOW: "orange",
    DONE: "emerald",
};

const typeColorMap: Record<CalendarEventType, EventColor> = {
    APPOINTMENT: "primary",
    VACATION: "amber",
    HOLIDAY: "violet",
    OTHER: "orange",
};

const blockTypeLabelKeys: Record<BlockType, string> = {
    VACATION: "calendarBlockTypeVacation",
    HOLIDAY: "calendarBlockTypeHoliday",
    OTHER: "calendarBlockTypeOther",
};

const toDate = (value: unknown, userTimeZone: string): Date | null => {
    if (!value) return null;
    let utcDate: Date | null = null;
    if (value instanceof Date) {
        utcDate = value;
    } else if (typeof value === "string") {
        const parsed = new Date(value);
        utcDate = Number.isNaN(parsed.getTime()) ? null : parsed;
    } else if (typeof (value as { toDate?: () => Date }).toDate === "function") {
        const parsed = (value as { toDate: () => Date }).toDate();
        utcDate = Number.isNaN(parsed.getTime()) ? null : parsed;
    } else {
        const millis = timestampToMillis(value as any, { defaultReturnedValue: Number.NaN });
        utcDate = Number.isNaN(millis) ? null : new Date(millis);
    }
    if (!utcDate) return null;
    return moment.utc(utcDate).tz(userTimeZone).toDate();
};

const buildDescription = (event: CalendarEventWithRelations): string | undefined => {
    const attendee = event.user ? [event.user.firstName, event.user.lastName].filter(Boolean).join(" ").trim() : "";
    const serviceName = event.service?.name?.trim() ?? "";
    const notes = event.notes?.trim() ?? "";
    const parts = [serviceName, attendee, notes].filter((part) => part.length > 0);
    return parts.length > 0 ? parts.join(" • ") : undefined;
};

const isAllDay = (event: CalendarEventWithRelations, start: Date, end: Date): boolean => {
    if (event.type && event.type !== "APPOINTMENT") return true;
    const duration = end.getTime() - start.getTime();
    if (duration >= 24 * 60 * 60 * 1000) return true;
    if (duration <= 0) {
        return start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 0 && end.getMinutes() === 0;
    }
    return false;
};

const mapBusinessEvent = (event: CalendarEventWithRelations, fallbackTitle: string, userTimeZone: string): UiCalendarEvent | null => {
    const startDate = toDate(event.start, userTimeZone);
    const endDate = toDate(event.end, userTimeZone);
    if (!startDate || !endDate) return null;

    const isAppointment = event.type === "APPOINTMENT";
    const description = isAppointment ? buildDescription(event) : undefined;
    const id = event.id ?? `${startDate.getTime()}-${endDate.getTime()}`;
    const color = isAppointment ? statusColorByStatus[event.status] : typeColorMap[event.type];

    return {
        id,
        // The create endpoint carries no title field, so a block's label round-trips through notes.
        title: isAppointment
            ? event.title?.trim() || event.service?.name || description || fallbackTitle
            : event.notes?.trim() || event.title?.trim() || fallbackTitle,
        description,
        start: startDate,
        end: endDate,
        allDay: isAllDay(event, startDate, endDate),
        color,
    };
};

function Calendar() {
    const params = useParams<{ businessId: string }>();
    const businessIdParam = params?.businessId;
    const businessId = Array.isArray(businessIdParam) ? businessIdParam[0] : businessIdParam;

    const userTimeZone = useSettingsStore.userTimeZone();
    const currentBusiness = useBusinessesStore.currentBusiness();
    const user = useAuthStore.user();
    const { t } = useLanguage();
    const refreshBusiness = useRefreshBusiness();

    const [blockDialogOpen, setBlockDialogOpen] = useState(false);
    const [blockType, setBlockType] = useState<BlockType>("VACATION");
    const [blockTitle, setBlockTitle] = useState("");
    const [blockStartDate, setBlockStartDate] = useState<Date>(new Date());
    const [blockEndDate, setBlockEndDate] = useState<Date>(new Date());
    const [isSaving, setIsSaving] = useState(false);

    const events = useMemo(() => {
        if (!currentBusiness?.calendar?.length) return [] as UiCalendarEvent[];
        return currentBusiness.calendar
            // Cancelling is how a block is removed — the record stays but stops blocking, and a
            // struck-out vacation on the grid would read as a delete that did not take.
            .filter((event) => event.type === "APPOINTMENT" || event.status !== "CANCELLED")
            .map((event) => mapBusinessEvent(event, t("calendarDefaultEventTitle"), userTimeZone))
            .filter((event): event is UiCalendarEvent => event !== null)
            .sort((a, b) => a.start.getTime() - b.start.getTime());
    }, [currentBusiness?.calendar, t, userTimeZone]);

    // The calendar renders straight from the store, so a rejected write has no local state to
    // roll back — refetching is what puts a dragged event back where the server still has it.
    const settle = async (action: Promise<unknown>, successKey: string) => {
        try {
            await action;
            toast.success(t(successKey));
        } catch (error: any) {
            console.error("Calendar write failed:", error);
            toast.error(error?.message || t("errorGeneric"));
        } finally {
            refreshBusiness();
        }
    };

    const handleEventAdd = async (event: UiCalendarEvent) => {
        if (!currentBusiness?.id || !user?.id) return;
        await settle(
            createCalendarEvent({
                businessId: currentBusiness.id,
                userId: user.id,
                type: "OTHER",
                startMillis: event.start.getTime(),
                endMillis: event.end.getTime(),
                notes: event.title?.trim() || undefined,
            }),
            "calendarBlockCreated"
        );
    };

    const handleEventUpdate = async (event: UiCalendarEvent) => {
        // Renaming is only meaningful for a block, whose label lives in notes; an appointment is
        // titled after the service it books and is not the owner's to rename from here.
        const source = currentBusiness?.calendar?.find((item) => item.id === event.id);
        const notes = source && source.type !== "APPOINTMENT" ? event.title?.trim() : undefined;
        await settle(rescheduleAppointment(event.id, event.start.getTime(), event.end.getTime(), notes), "calendarEventRescheduled");
    };

    const handleEventDelete = async (eventId: string) => {
        await settle(cancelAppointment(eventId), "appointmentCancelled");
    };

    const handleCreateBlock = async () => {
        if (!currentBusiness?.id || !user?.id) return;

        // Days are bounded in the viewer's timezone, not the browser's: a block is a business
        // decision about its own calendar day, and the two zones do not always agree on one.
        const start = moment.tz(format(blockStartDate, "yyyy-MM-dd"), userTimeZone).startOf("day");
        const end = moment.tz(format(blockEndDate, "yyyy-MM-dd"), userTimeZone).endOf("day");
        if (end.valueOf() <= start.valueOf()) {
            toast.error(t("calendarDialogErrorEndBeforeStart"));
            return;
        }

        setIsSaving(true);
        try {
            await createCalendarEvent({
                businessId: currentBusiness.id,
                userId: user.id,
                type: blockType,
                startMillis: start.valueOf(),
                endMillis: end.valueOf(),
                notes: blockTitle.trim() || t(blockTypeLabelKeys[blockType]),
            });
            refreshBusiness();
            setBlockDialogOpen(false);
            setBlockTitle("");
            toast.success(t("calendarBlockCreated"));
        } catch (error: any) {
            console.error("Error creating block:", error);
            toast.error(error?.message || t("errorGeneric"));
        } finally {
            setIsSaving(false);
        }
    };

    if (!currentBusiness || (businessId && currentBusiness.id !== businessId)) {
        return <BusinessLoading />;
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                        setBlockType("VACATION");
                        setBlockDialogOpen(true);
                    }}
                >
                    <Palmtree className="h-4 w-4 me-1" />
                    {t("calendarNewEvent")}
                </Button>
            </div>

            <EventCalendar events={events} onEventAdd={handleEventAdd} onEventUpdate={handleEventUpdate} onEventDelete={handleEventDelete} />

            <Dialog open={blockDialogOpen} onOpenChange={(open) => !open && setBlockDialogOpen(false)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{t("calendarDialogCreateTitle")}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>{t("calendarDialogFieldTitle")}</Label>
                            <Input value={blockTitle} onChange={(e) => setBlockTitle(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>{t("calendarBlockTypeLabel")}</Label>
                            <Select value={blockType} onValueChange={(val) => setBlockType(val as BlockType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(Object.keys(blockTypeLabelKeys) as BlockType[]).map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {t(blockTypeLabelKeys[type])}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>{t("calendarDialogFieldStartDate")}</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="justify-start">
                                            <CalendarDays className="h-4 w-4 me-2" />
                                            {format(blockStartDate, "PP")}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <CalendarPicker mode="single" selected={blockStartDate} onSelect={(d) => d && setBlockStartDate(d)} />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="grid gap-2">
                                <Label>{t("calendarDialogFieldEndDate")}</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="justify-start">
                                            <CalendarDays className="h-4 w-4 me-2" />
                                            {format(blockEndDate, "PP")}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <CalendarPicker mode="single" selected={blockEndDate} onSelect={(d) => d && setBlockEndDate(d)} />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBlockDialogOpen(false)} disabled={isSaving}>
                            {t("cancel")}
                        </Button>
                        <Button onClick={handleCreateBlock} disabled={isSaving}>
                            {isSaving ? t("saving") : t("add")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default Calendar;
