"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RiCalendarCheckLine } from "@remixicon/react";
import { addDays, addMonths, addWeeks, endOfWeek, format, isSameMonth, startOfWeek, subMonths, subWeeks } from "date-fns";
import { enUS, he } from "date-fns/locale";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import {
    AgendaDaysToShow,
    EventGap,
    EventHeight,
    WeekCellsHeight,
    addHoursToDate,
    type CalendarEvent,
    type CalendarView,
} from "@/components/CalendarComponent";
import { AgendaView } from "@/components/CalendarComponent/agenda-view";
import { CalendarDndProvider } from "@/components/CalendarComponent/calendar-dnd-context";
import { DayView } from "@/components/CalendarComponent/day-view";
import { EventDialog } from "@/components/CalendarComponent/event-dialog";
import { MonthView } from "@/components/CalendarComponent/month-view";
import { WeekView } from "@/components/CalendarComponent/week-view";
import { CalendarLocalizationProvider } from "@/components/CalendarComponent/helpers/localization";
import { useLanguage } from "@/hooks";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuShortcut, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import StarBorder from "../StarBorder";

export interface EventCalendarProps {
    events?: CalendarEvent[];
    onEventAdd?: (event: CalendarEvent) => void;
    onEventUpdate?: (event: CalendarEvent) => void;
    onEventDelete?: (eventId: string) => void;
    className?: string;
    initialView?: CalendarView;
}

export function EventCalendar({ events = [], onEventAdd, onEventUpdate, onEventDelete, className, initialView = "month" }: EventCalendarProps) {
    const { t, dir, isRtl, language } = useLanguage();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<CalendarView>(initialView);
    const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    const locale = useMemo(() => (language === "he" ? he : enUS), [language]);

    const translate = useCallback(
        (key: string, replacements?: Record<string, string | number>) => {
            let value = t(key as any) ?? key;
            if (replacements) {
                Object.entries(replacements).forEach(([token, tokenValue]) => {
                    value = value.replace(new RegExp(`{${token}}`, "g"), String(tokenValue));
                });
            }
            return value;
        },
        [t]
    );

    const viewLabels = useMemo(
        () => ({
            month: translate("calendarViewMonth"),
            week: translate("calendarViewWeek"),
            day: translate("calendarViewDay"),
            agenda: translate("calendarViewAgenda"),
        }),
        [translate]
    );

    const viewShortLabels = useMemo(
        () => ({
            month: viewLabels.month.charAt(0).toUpperCase(),
            week: viewLabels.week.charAt(0).toUpperCase(),
            day: viewLabels.day.charAt(0).toUpperCase(),
            agenda: viewLabels.agenda.charAt(0).toUpperCase(),
        }),
        [viewLabels]
    );

    const toastPosition = isRtl ? "bottom-right" : "bottom-left";

    // Add keyboard shortcuts for view switching
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Skip if user is typing in an input, textarea or contentEditable element
            // or if the event dialog is open
            if (
                isEventDialogOpen ||
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target instanceof HTMLElement && e.target.isContentEditable)
            ) {
                return;
            }

            switch (e.key.toLowerCase()) {
                case "m":
                    setView("month");
                    break;
                case "w":
                    setView("week");
                    break;
                case "d":
                    setView("day");
                    break;
                case "a":
                    setView("agenda");
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isEventDialogOpen]);

    const handlePrevious = () => {
        if (view === "month") {
            setCurrentDate(subMonths(currentDate, 1));
        } else if (view === "week") {
            setCurrentDate(subWeeks(currentDate, 1));
        } else if (view === "day") {
            setCurrentDate(addDays(currentDate, -1));
        } else if (view === "agenda") {
            // For agenda view, go back 30 days (a full month)
            setCurrentDate(addDays(currentDate, -AgendaDaysToShow));
        }
    };

    const handleNext = () => {
        if (view === "month") {
            setCurrentDate(addMonths(currentDate, 1));
        } else if (view === "week") {
            setCurrentDate(addWeeks(currentDate, 1));
        } else if (view === "day") {
            setCurrentDate(addDays(currentDate, 1));
        } else if (view === "agenda") {
            // For agenda view, go forward 30 days (a full month)
            setCurrentDate(addDays(currentDate, AgendaDaysToShow));
        }
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const handleEventSelect = (event: CalendarEvent) => {
        console.log("Event selected:", event); // Debug log
        setSelectedEvent(event);
        setIsEventDialogOpen(true);
    };

    const handleEventCreate = (startTime: Date) => {
        console.log("Creating new event at:", startTime); // Debug log

        // Snap to 15-minute intervals
        const minutes = startTime.getMinutes();
        const remainder = minutes % 15;
        if (remainder !== 0) {
            if (remainder < 7.5) {
                // Round down to nearest 15 min
                startTime.setMinutes(minutes - remainder);
            } else {
                // Round up to nearest 15 min
                startTime.setMinutes(minutes + (15 - remainder));
            }
            startTime.setSeconds(0);
            startTime.setMilliseconds(0);
        }

        const newEvent: CalendarEvent = {
            id: "",
            title: "",
            start: startTime,
            end: addHoursToDate(startTime, 1),
            allDay: false,
        };
        setSelectedEvent(newEvent);
        setIsEventDialogOpen(true);
    };

    const handleEventSave = (event: CalendarEvent) => {
        if (event.id) {
            onEventUpdate?.(event);
            // Show toast notification when an event is updated
            toast(
                translate("calendarToastEventUpdated", {
                    title: event.title || translate("calendarDialogNoTitle"),
                }),
                {
                    description: format(new Date(event.start), "PPP", { locale }),
                    position: toastPosition,
                }
            );
        } else {
            const newEvent = {
                ...event,
                id: Math.random().toString(36).substring(2, 11),
            };
            onEventAdd?.(newEvent);
            // Show toast notification when an event is added
            toast(
                translate("calendarToastEventAdded", {
                    title: newEvent.title || translate("calendarDialogNoTitle"),
                }),
                {
                    description: format(new Date(newEvent.start), "PPP", { locale }),
                    position: toastPosition,
                }
            );
        }
        setIsEventDialogOpen(false);
        setSelectedEvent(null);
    };

    const handleEventDelete = (eventId: string) => {
        const deletedEvent = events.find((e) => e.id === eventId);
        onEventDelete?.(eventId);
        setIsEventDialogOpen(false);
        setSelectedEvent(null);

        // Show toast notification when an event is deleted
        if (deletedEvent) {
            toast(
                translate("calendarToastEventDeleted", {
                    title: deletedEvent.title || translate("calendarDialogNoTitle"),
                }),
                {
                    description: format(new Date(deletedEvent.start), "PPP", { locale }),
                    position: toastPosition,
                }
            );
        }
    };

    const handleEventUpdate = (updatedEvent: CalendarEvent) => {
        onEventUpdate?.(updatedEvent);

        // Show toast notification when an event is updated via drag and drop
        toast(
            translate("calendarToastEventMoved", {
                title: updatedEvent.title || translate("calendarDialogNoTitle"),
            }),
            {
                description: format(new Date(updatedEvent.start), "PPP", { locale }),
                position: toastPosition,
            }
        );
    };

    const viewTitle = useMemo(() => {
        if (view === "month") {
            return format(currentDate, "LLLL yyyy", { locale });
        } else if (view === "week") {
            const start = startOfWeek(currentDate, { weekStartsOn: 0 });
            const end = endOfWeek(currentDate, { weekStartsOn: 0 });
            if (isSameMonth(start, end)) {
                return format(start, "LLLL yyyy", { locale });
            } else {
                return `${format(start, "LLL", { locale })} - ${format(end, "LLL yyyy", { locale })}`;
            }
        } else if (view === "day") {
            return (
                <>
                    <span className="min-[480px]:hidden" aria-hidden="true">
                        {format(currentDate, "PP", { locale })}
                    </span>
                    <span className="max-[479px]:hidden min-md:hidden" aria-hidden="true">
                        {format(currentDate, "PPPP", { locale })}
                    </span>
                    <span className="max-md:hidden">{format(currentDate, "PPPP", { locale })}</span>
                </>
            );
        } else if (view === "agenda") {
            // Show the month range for agenda view
            const start = currentDate;
            const end = addDays(currentDate, AgendaDaysToShow - 1);

            if (isSameMonth(start, end)) {
                return format(start, "LLLL yyyy", { locale });
            } else {
                return `${format(start, "LLL", { locale })} - ${format(end, "LLL yyyy", { locale })}`;
            }
        } else {
            return format(currentDate, "LLLL yyyy", { locale });
        }
    }, [currentDate, locale, view]);

    return (
        <CalendarLocalizationProvider value={{ locale, dir, isRtl, translate }}>
            <div
                dir={dir}
                data-rtl={isRtl || undefined}
                className="flex flex-col rounded-lg border has-data-[slot=month-view]:flex-1"
                style={
                    {
                        "--event-height": `${EventHeight}px`,
                        "--event-gap": `${EventGap}px`,
                        "--week-cells-height": `${WeekCellsHeight}px`,
                    } as React.CSSProperties
                }
            >
                <CalendarDndProvider onEventUpdate={handleEventUpdate}>
                    <div className={cn("flex items-center justify-between p-2 sm:p-4", className)} dir={dir} data-rtl={isRtl || undefined}>
                        <div className="flex items-center gap-1 sm:gap-4">
                            <Button
                                variant="outline"
                                className="max-[479px]:aspect-square max-[479px]:p-0!"
                                onClick={handleToday}
                                aria-label={translate("today")}
                            >
                                <RiCalendarCheckLine className="min-[480px]:hidden" size={16} aria-hidden="true" />
                                <span className="hidden min-[480px]:inline">{translate("today")}</span>
                            </Button>
                            <div className="flex gap-0 items-center sm:gap-2">
                                <Button className="px-0 size-6 sm:size-9" variant="ghost" size="icon" onClick={handlePrevious} aria-label={translate("calendarAriaPrevious")}>
                                    {isRtl ? <ChevronRightIcon size={16} aria-hidden="true" /> : <ChevronLeftIcon size={16} aria-hidden="true" />}
                                </Button>
                                <Button className="px-0 size-6 sm:size-9" variant="ghost" size="icon" onClick={handleNext} aria-label={translate("calendarAriaNext")}>
                                    {isRtl ? <ChevronLeftIcon size={16} aria-hidden="true" /> : <ChevronRightIcon size={16} aria-hidden="true" />}
                                </Button>
                            </div>
                            <h2 className="text-sm font-semibold sm:text-lg md:text-xl">{viewTitle}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="gap-1.5 max-[479px]:h-8">
                                        <span>
                                            <span className="min-[480px]:hidden" aria-hidden="true">
                                                {viewShortLabels[view]}
                                            </span>
                                            <span className="hidden min-[480px]:inline">{viewLabels[view]}</span>
                                        </span>
                                        <ChevronDownIcon className="-me-1 opacity-60" size={16} aria-hidden="true" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align={isRtl ? "start" : "end"}
                                    className={cn("min-w-32", isRtl && "text-right")}
                                    style={{ direction: dir }}
                                >
                                    <DropdownMenuItem onClick={() => setView("month")}>
                                        {viewLabels.month} <DropdownMenuShortcut>M</DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setView("week")}>
                                        {viewLabels.week} <DropdownMenuShortcut>W</DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setView("day")}>
                                        {viewLabels.day} <DropdownMenuShortcut>D</DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setView("agenda")}>
                                        {viewLabels.agenda} <DropdownMenuShortcut>A</DropdownMenuShortcut>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <StarBorder
                                className="hidden lg:flex lg:w-auto"
                                onClick={() => {
                                    setSelectedEvent(null);
                                    setIsEventDialogOpen(true);
                                }}
                            >
                                <div className="flex items-center gap-1">
                                    <PlusIcon className="opacity-60 sm:-ms-1" size={16} aria-hidden="true" />
                                    <span className="hidden sm:inline">{translate("calendarNewEvent")}</span>
                                </div>
                            </StarBorder>
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col">
                        {view === "month" && (
                            <MonthView
                                currentDate={currentDate}
                                events={events}
                                onEventSelect={handleEventSelect}
                                onEventCreate={handleEventCreate}
                            />
                        )}
                        {view === "week" && (
                            <WeekView currentDate={currentDate} events={events} onEventSelect={handleEventSelect} onEventCreate={handleEventCreate} />
                        )}
                        {view === "day" && (
                            <DayView currentDate={currentDate} events={events} onEventSelect={handleEventSelect} onEventCreate={handleEventCreate} />
                        )}
                        {view === "agenda" && <AgendaView currentDate={currentDate} events={events} onEventSelect={handleEventSelect} />}
                    </div>

                    <EventDialog
                        event={selectedEvent}
                        isOpen={isEventDialogOpen}
                        onClose={() => {
                            setIsEventDialogOpen(false);
                            setSelectedEvent(null);
                        }}
                        onSave={handleEventSave}
                        onDelete={handleEventDelete}
                    />
                </CalendarDndProvider>
            </div>
        </CalendarLocalizationProvider>
    );
}
