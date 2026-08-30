"use client";

import { useMemo } from "react";
import { RiCalendarEventLine } from "@remixicon/react";
import { addDays, format, isToday } from "date-fns";

import { EventItem } from "@/components/CalendarComponent/event-item";
import { getAgendaEventsForDay, type CalendarEvent, AgendaDaysToShow } from "@/components/CalendarComponent/helpers";
import { useCalendarLocalization } from "@/components/CalendarComponent/helpers/localization";
import { cn } from "@/lib/utils";

interface AgendaViewProps {
    currentDate: Date;
    events: CalendarEvent[];
    onEventSelect: (event: CalendarEvent) => void;
}

export function AgendaView({ currentDate, events, onEventSelect }: AgendaViewProps) {
    const { translate, locale, isRtl } = useCalendarLocalization();
    // Show events for the next days based on constant
    const days = useMemo(() => {
        console.log("Agenda view updating with date:", currentDate.toISOString());
        return Array.from({ length: AgendaDaysToShow }, (_, i) => addDays(new Date(currentDate), i));
    }, [currentDate]);

    const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
        e.stopPropagation();
        console.log("Agenda view event clicked:", event);
        onEventSelect(event);
    };

    // Check if there are any days with events
    const hasEvents = days.some((day) => getAgendaEventsForDay(events, day).length > 0);

    return (
        <div className="border-t border-border/70 px-4">
            {!hasEvents ? (
                <div className="flex min-h-[70svh] flex-col items-center justify-center py-16 text-center">
                    <RiCalendarEventLine size={32} className="mb-2 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium">{translate("calendarNoEventsTitle")}</h3>
                    <p className="text-muted-foreground">{translate("calendarNoEventsSubtitle")}</p>
                </div>
            ) : (
                days.map((day) => {
                    const dayEvents = getAgendaEventsForDay(events, day);

                    if (dayEvents.length === 0) return null;

                    return (
                        <div key={day.toString()} className="relative my-12 border-t border-border/70">
                            <span
                                className={cn(
                                    "absolute -top-3 flex h-6 items-center bg-background text-[10px] uppercase data-today:font-medium sm:text-xs",
                                    isRtl ? "right-0 ps-4 text-right sm:ps-4" : "left-0 pe-4 sm:pe-4"
                                )}
                                data-today={isToday(day) || undefined}
                            >
                                {format(day, "d MMMM, EEEE", { locale })}
                            </span>
                            <div className="mt-6 space-y-2">
                                {dayEvents.map((event) => (
                                    <EventItem key={event.id} event={event} view="agenda" onClick={(e) => handleEventClick(event, e)} />
                                ))}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
