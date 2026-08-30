"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import moment from "moment-timezone";
import CalendarComponent from "@/components/CalendarComponent/CalendarComponent";
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
import { CalendarDays, Palmtree, Ban } from "lucide-react";
import { format } from "date-fns";
import { addDocument } from "@/lib/firebase";
import { useRefreshBusiness } from "../hooks";
import { Timestamp } from "firebase/firestore";
import { useAuthStore } from "@/lib/store";

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

    const description = buildDescription(event);
    const id = event.id ?? `${startDate.getTime()}-${endDate.getTime()}`;
    const color = event.type !== "APPOINTMENT" ? typeColorMap[event.type] : statusColorByStatus[event.status];

    return {
        id,
        title: event.title?.trim() || event.service?.name || description || fallbackTitle,
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
    const [blockType, setBlockType] = useState<"VACATION" | "HOLIDAY" | "OTHER">("VACATION");
    const [blockTitle, setBlockTitle] = useState("");
    const [blockStartDate, setBlockStartDate] = useState<Date>(new Date());
    const [blockEndDate, setBlockEndDate] = useState<Date>(new Date());
    const [isSaving, setIsSaving] = useState(false);

    const events = useMemo(() => {
        if (!currentBusiness?.calendar?.length) return [] as UiCalendarEvent[];
        return currentBusiness.calendar
            .map((event) => mapBusinessEvent(event, t("calendarDefaultEventTitle"), userTimeZone))
            .filter((event): event is UiCalendarEvent => event !== null)
            .sort((a, b) => a.start.getTime() - b.start.getTime());
    }, [currentBusiness?.calendar, t, userTimeZone]);

    const handleCreateBlock = async () => {
        if (!currentBusiness?.id || !user?.id) return;
        setIsSaving(true);
        try {
            const start = new Date(blockStartDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(blockEndDate);
            end.setHours(23, 59, 59, 999);

            const startUtc = moment.tz(start, userTimeZone).utc().toDate();
            const endUtc = moment.tz(end, userTimeZone).utc().toDate();

            await addDocument("calendar", {
                businessId: currentBusiness.id,
                userId: user.id,
                type: blockType,
                status: "CONFIRMED",
                title: blockTitle || (blockType === "VACATION" ? "Vacation" : blockType === "HOLIDAY" ? "Holiday" : "Block"),
                start: Timestamp.fromDate(startUtc),
                end: Timestamp.fromDate(endUtc),
                created: Timestamp.now(),
                timestamp: Timestamp.now(),
            });
            refreshBusiness();
            setBlockDialogOpen(false);
            setBlockTitle("");
        } catch (error) {
            console.error("Error creating block:", error);
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
                    <Palmtree className="h-4 w-4 mr-1" />
                    {t("calendarNewEvent")}
                </Button>
            </div>

            <CalendarComponent events={events} />

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
                            <Label>Type</Label>
                            <Select value={blockType} onValueChange={(val) => setBlockType(val as typeof blockType)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="VACATION">Vacation</SelectItem>
                                    <SelectItem value="HOLIDAY">Holiday</SelectItem>
                                    <SelectItem value="OTHER">Block/Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>{t("calendarDialogFieldStartDate")}</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="justify-start">
                                            <CalendarDays className="h-4 w-4 mr-2" />
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
                                            <CalendarDays className="h-4 w-4 mr-2" />
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
