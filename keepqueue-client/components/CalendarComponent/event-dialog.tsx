"use client";

import { useEffect, useMemo, useState } from "react";
import { RiCalendarLine, RiDeleteBinLine } from "@remixicon/react";
import { format, isBefore } from "date-fns";

import { DefaultEndHour, DefaultStartHour, EndHour, StartHour, CalendarEvent, EventColor } from "@/components/CalendarComponent";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCalendarLocalization } from "@/components/CalendarComponent/helpers/localization";

interface EventDialogProps {
    event: CalendarEvent | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: CalendarEvent) => void;
    onDelete: (eventId: string) => void;
}

export function EventDialog({ event, isOpen, onClose, onSave, onDelete }: EventDialogProps) {
    const { translate, locale, dir, isRtl } = useCalendarLocalization();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [startTime, setStartTime] = useState(`${DefaultStartHour}:00`);
    const [endTime, setEndTime] = useState(`${DefaultEndHour}:00`);
    const [allDay, setAllDay] = useState(false);
    const [location, setLocation] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);

    // Debug log to check what event is being passed
    useEffect(() => {
        console.log("EventDialog received event:", event);
    }, [event]);

    useEffect(() => {
        if (event) {
            setTitle(event.title || "");
            setDescription(event.description || "");

            const start = new Date(event.start);
            const end = new Date(event.end);

            setStartDate(start);
            setEndDate(end);
            setStartTime(formatTimeForInput(start));
            setEndTime(formatTimeForInput(end));
            setAllDay(event.allDay || false);
            setLocation(event.location || "");
            setError(null); // Reset error when opening dialog
        } else {
            resetForm();
        }
    }, [event]);

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setStartDate(new Date());
        setEndDate(new Date());
        setStartTime(`${DefaultStartHour}:00`);
        setEndTime(`${DefaultEndHour}:00`);
        setAllDay(false);
        setLocation("");
        setError(null);
    };

    const formatTimeForInput = (date: Date) => {
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = Math.floor(date.getMinutes() / 15) * 15;
        return `${hours}:${minutes.toString().padStart(2, "0")}`;
    };

    // Memoize time options so they're only calculated once
    const timeOptions = useMemo(() => {
        const options = [];
        for (let hour = StartHour; hour <= EndHour; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                const formattedHour = hour.toString().padStart(2, "0");
                const formattedMinute = minute.toString().padStart(2, "0");
                const value = `${formattedHour}:${formattedMinute}`;
                // Use a fixed date to avoid unnecessary date object creations
                const date = new Date(2000, 0, 1, hour, minute);
                const label = format(date, "p", { locale });
                options.push({ value, label });
            }
        }
        return options;
    }, [locale]); // Recompute when locale changes

    const handleSave = () => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (!allDay) {
            const [startHours = 0, startMinutes = 0] = startTime.split(":").map(Number);
            const [endHours = 0, endMinutes = 0] = endTime.split(":").map(Number);

            if (startHours < StartHour || startHours > EndHour || endHours < StartHour || endHours > EndHour) {
                setError(
                    translate("calendarDialogErrorTimeRange", {
                        start: `${StartHour}:00`,
                        end: `${EndHour}:00`,
                    })
                );
                return;
            }

            start.setHours(startHours, startMinutes, 0);
            end.setHours(endHours, endMinutes, 0);
        } else {
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        }

        // Validate that end date is not before start date
        if (isBefore(end, start)) {
            setError(translate("calendarDialogErrorEndBeforeStart"));
            return;
        }

        // Use generic title if empty
        const eventTitle = title.trim() ? title : translate("calendarDialogNoTitle");

        onSave({
            id: event?.id || "",
            title: eventTitle,
            description,
            start,
            end,
            allDay,
            location,
        });
    };

    const handleDelete = () => {
        if (event?.id) {
            onDelete(event.id);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent dir={dir} data-rtl={isRtl || undefined} className={cn("sm:max-w-[425px]", isRtl && "text-right")}>
                <DialogHeader>
                    <DialogTitle>{event?.id ? translate("calendarDialogEditTitle") : translate("calendarDialogCreateTitle")}</DialogTitle>
                    <DialogDescription className="sr-only">
                        {event?.id ? translate("calendarDialogEditDescription") : translate("calendarDialogCreateDescription")}
                    </DialogDescription>
                </DialogHeader>
                {error && <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{error}</div>}
                <div className="grid gap-4 py-4">
                    <div className="*:not-first:mt-1.5">
                        <Label htmlFor="title">{translate("calendarDialogFieldTitle")}</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} dir={dir} />
                    </div>

                    <div className="*:not-first:mt-1.5">
                        <Label htmlFor="description">{translate("calendarDialogFieldDescription")}</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} dir={dir} />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 *:not-first:mt-1.5">
                            <Label htmlFor="start-date">{translate("calendarDialogFieldStartDate")}</Label>
                            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="start-date"
                                        variant={"outline"}
                                        className={cn(
                                            "group w-full justify-between border-input bg-background px-3 font-normal outline-offset-0 outline-none hover:bg-background focus-visible:outline-[3px]",
                                            !startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <span className={cn("truncate", !startDate && "text-muted-foreground")}>
                                            {startDate ? format(startDate, "PPP", { locale }) : translate("calendarDialogPickDate")}
                                        </span>
                                        <RiCalendarLine size={16} className="shrink-0 text-muted-foreground/80" aria-hidden="true" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-2" align={isRtl ? "end" : "start"} dir={dir}>
                                    <Calendar
                                        locale={locale}
                                        mode="single"
                                        selected={startDate}
                                        defaultMonth={startDate}
                                        onSelect={(date) => {
                                            if (date) {
                                                setStartDate(date);
                                                if (isBefore(endDate, date)) {
                                                    setEndDate(date);
                                                }
                                                setError(null);
                                                setStartDateOpen(false);
                                            }
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {!allDay && (
                            <div className="min-w-28 *:not-first:mt-1.5">
                                <Label htmlFor="start-time">{translate("calendarDialogFieldStartTime")}</Label>
                                <Select value={startTime} onValueChange={setStartTime}>
                                    <SelectTrigger id="start-time" dir={dir}>
                                        <SelectValue placeholder={translate("calendarDialogSelectTime")} />
                                    </SelectTrigger>
                                    <SelectContent dir={dir}>
                                        {timeOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 *:not-first:mt-1.5">
                            <Label htmlFor="end-date">{translate("calendarDialogFieldEndDate")}</Label>
                            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="end-date"
                                        variant={"outline"}
                                        className={cn(
                                            "group w-full justify-between border-input bg-background px-3 font-normal outline-offset-0 outline-none hover:bg-background focus-visible:outline-[3px]",
                                            !endDate && "text-muted-foreground"
                                        )}
                                    >
                                        <span className={cn("truncate", !endDate && "text-muted-foreground")}>
                                            {endDate ? format(endDate, "PPP", { locale }) : translate("calendarDialogPickDate")}
                                        </span>
                                        <RiCalendarLine size={16} className="shrink-0 text-muted-foreground/80" aria-hidden="true" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-2" align={isRtl ? "end" : "start"} dir={dir}>
                                    <Calendar
                                        locale={locale}
                                        mode="single"
                                        selected={endDate}
                                        defaultMonth={endDate}
                                        disabled={{ before: startDate }}
                                        onSelect={(date) => {
                                            if (date) {
                                                setEndDate(date);
                                                setError(null);
                                                setEndDateOpen(false);
                                            }
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {!allDay && (
                            <div className="min-w-28 *:not-first:mt-1.5">
                                <Label htmlFor="end-time">{translate("calendarDialogFieldEndTime")}</Label>
                                <Select value={endTime} onValueChange={setEndTime}>
                                    <SelectTrigger id="end-time" dir={dir}>
                                        <SelectValue placeholder={translate("calendarDialogSelectTime")} />
                                    </SelectTrigger>
                                    <SelectContent dir={dir}>
                                        {timeOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox id="all-day" checked={allDay} onCheckedChange={(checked) => setAllDay(checked === true)} />
                        <Label htmlFor="all-day">{translate("calendarDialogAllDay")}</Label>
                    </div>

                    <div className="*:not-first:mt-1.5">
                        <Label htmlFor="location">{translate("calendarDialogLocation")}</Label>
                        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} dir={dir} />
                    </div>
                </div>
                <DialogFooter className={cn("flex-row sm:justify-between", isRtl && "flex-row-reverse sm:flex-row-reverse")}>
                    {event?.id && (
                        <Button variant="outline" size="icon" onClick={handleDelete} aria-label={translate("calendarDialogDeleteEventAria")}>
                            <RiDeleteBinLine size={16} aria-hidden="true" />
                        </Button>
                    )}
                    <div className={cn("flex flex-1 justify-end gap-2", isRtl && "justify-start")}>
                        <Button variant="outline" onClick={onClose}>
                            {translate("cancel")}
                        </Button>
                        <Button onClick={handleSave}>{translate("save")}</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
