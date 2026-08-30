"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore, useBusinessesStore, useSettingsStore } from "@/lib/store";
import type { Service, CalendarEvent, OperationSchedule, AvailabilitySlot } from "@/lib/types";
import { timestampToMillis } from "@/lib/helpers/time";
import moment from "moment-timezone";
import { getDocumentById, queryDocuments } from "@/lib/firebase/firestore";
import { useLanguage } from "@/hooks";
import { apiCall, ApiError } from "@/lib/helpers/api";
import { formatWorkingHoursFromSchedule } from "@/lib/helpers/schedule";
import { Timestamp } from "firebase/firestore";

export interface DateOption {
    date: string;
    day: string;
    available: boolean;
}
export interface TimeOption {
    time: string;
    available: boolean;
}

export interface BusinessDisplay {
    name: string;
    rating: number;
    reviews: number;
    address: string;
    phone: string;
    email: string;
    image?: string;
    description: string;
    workingHours: string;
}

export interface CustomerInfo {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    notes: string;
}

export function useBookingState(businessId: string) {
    const { t } = useLanguage();
    const currentBusiness = useBusinessesStore.currentBusiness();
    const user = useAuthStore.user();
    const userTimeZone = useSettingsStore.userTimeZone();

    const [fallbackLoaded, setFallbackLoaded] = useState(false);
    const [fallbackServices, setFallbackServices] = useState<Service[]>([]);
    const [fallbackCalendar, setFallbackCalendar] = useState<CalendarEvent[]>([]);
    const [fallbackSchedule, setFallbackSchedule] = useState<OperationSchedule[]>([]);
    const [fallbackMeta, setFallbackMeta] = useState<{ name?: string; phone?: string; logoUrl?: string } | null>(null);

    const [selectedService, setSelectedServiceState] = useState<string | null>(null);
    const [selectedDate, setSelectedDateState] = useState<string>("");
    const [selectedTime, setSelectedTimeState] = useState<string>("");
    const [step, setStep] = useState<number>(1);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ firstName: "", lastName: "", phone: "", email: "", notes: "" });
    const [isBooking, setIsBooking] = useState<boolean>(false);
    const [bookingError, setBookingError] = useState<string | null>(null);
    const [serviceAvailability, setServiceAvailability] = useState<AvailabilitySlot[]>([]);
    const [isLoadingAvailability, setIsLoadingAvailability] = useState<boolean>(false);
    const [isCancellingAppointment, setIsCancellingAppointment] = useState<boolean>(false);
    const [cancellingAppointmentId, setCancellingAppointmentId] = useState<string | null>(null);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [cancelledAppointmentIds, setCancelledAppointmentIds] = useState<string[]>([]);

    useEffect(() => {
        const run = async () => {
            if (currentBusiness || fallbackLoaded || !businessId) return;
            try {
                // TODO: replace it with api call to get business data
                const b: any = await getDocumentById("businesses", businessId);
                if (b) {
                    setFallbackMeta({ name: b.name, phone: b.phone, logoUrl: b.logoUrl });
                    setFallbackSchedule((b.operationSchedule as OperationSchedule[]) ?? []);
                    const s = await queryDocuments("services", "businessId", "==", businessId);
                    const c = await queryDocuments("calendar", "businessId", "==", businessId);
                    setFallbackServices((s as any) ?? []);
                    setFallbackCalendar((c as any) ?? []);
                }
            } catch (_) {
                // ignore
            } finally {
                setFallbackLoaded(true);
            }
        };
        run();
    }, [currentBusiness, fallbackLoaded, businessId]);

    const workingHoursDisplay = useMemo(() => {
        const schedule = currentBusiness?.operationSchedule ?? fallbackSchedule;
        return formatWorkingHoursFromSchedule(schedule, (key: string) => t(key as any));
    }, [currentBusiness?.operationSchedule, fallbackSchedule, t]);

    const business: BusinessDisplay = useMemo(() => {
        const b = currentBusiness;
        return {
            name: b?.name ?? fallbackMeta?.name ?? "",
            rating: b?.ratingAvg ?? 0,
            reviews: b?.ratingCount ?? 0,
            address: "-",
            phone: b?.phone ?? fallbackMeta?.phone ?? "-",
            email: "",
            image: b?.logoUrl ?? fallbackMeta?.logoUrl,
            description: "",
            workingHours: workingHoursDisplay,
        };
    }, [currentBusiness, fallbackMeta, workingHoursDisplay]);

    const services: Service[] = useMemo(() => currentBusiness?.services ?? fallbackServices, [currentBusiness?.services, fallbackServices]);

    const selectedServiceData = useMemo(() => services.find((s) => s.id === selectedService), [services, selectedService]);

    // Fetch availability from server when service is selected
    useEffect(() => {
        const fetchAvailability = async () => {
            if (!selectedService) {
                setServiceAvailability([]);
                return;
            }
            
            setIsLoadingAvailability(true);
            try {
                const availability = await apiCall<AvailabilitySlot[]>(
                    "POST",
                    "data",
                    "getAvailabilityByServiceId",
                    { serviceId: selectedService }
                );
                setServiceAvailability(availability ?? []);
            } catch (error) {
                console.error("Error fetching availability:", error);
                setServiceAvailability([]);
            } finally {
                setIsLoadingAvailability(false);
            }
        };
        
        fetchAvailability();
    }, [selectedService]);

    const businessOperationSchedule = useMemo(
        () => currentBusiness?.operationSchedule ?? fallbackSchedule,
        [currentBusiness?.operationSchedule, fallbackSchedule]
    );
    const serviceOperationSchedule = useMemo(() => selectedServiceData?.operationSchedule ?? [], [selectedServiceData]);

    const isSameDay = (ms: number, m: moment.Moment) => {
        const d = moment.tz(ms, userTimeZone);
        return d.year() === m.year() && d.month() === m.month() && d.date() === m.date();
    };

    const eventBlocksForDate = useMemo(() => {
        const events = ((currentBusiness?.calendar as any) ?? fallbackCalendar) as CalendarEvent[];
        if (!selectedDate) return [] as { start: number; end: number }[];
        const m = moment.tz(selectedDate, "DD/MM/YY", userTimeZone);
        return events
            .filter((e) => {
                const status = e.status;
                if (status === "CANCELLED") return false;
                const startMs = timestampToMillis(e.start);
                const endMs = timestampToMillis(e.end);
                return isSameDay(startMs, m) || isSameDay(endMs, m);
            })
            .map((e) => ({ start: timestampToMillis(e.start), end: timestampToMillis(e.end) }));
    }, [currentBusiness?.calendar, fallbackCalendar, selectedDate, userTimeZone]);

    const hasFreeSlot = (startMs: number, endMs: number) => {
        return !eventBlocksForDate.some((b) => Math.max(b.start, startMs) < Math.min(b.end, endMs));
    };

    const withinSchedule = (startMs: number, endMs: number) => {
        const startMoment = moment.utc(startMs);
        const endMoment = moment.utc(endMs);
        if (!startMoment.isSame(endMoment, "day")) return false;

        const startDay: number = startMoment.day();
        const startMinOfDay = startMoment.hours() * 60 + startMoment.minutes();
        const endMinOfDay = endMoment.hours() * 60 + endMoment.minutes();

        const isWithin = (schedule: OperationSchedule[]) => {
            const daySchedule = schedule.find((s) => s.day === (startDay as any));
            if (!daySchedule) return false;
            return daySchedule.intervals.some((interval) => startMinOfDay >= interval.startMin && endMinOfDay <= interval.endMin);
        };

        if (serviceOperationSchedule && serviceOperationSchedule.length > 0) {
            return isWithin(businessOperationSchedule) && isWithin(serviceOperationSchedule);
        }
        return isWithin(businessOperationSchedule);
    };

    const availableDates: DateOption[] = useMemo(() => {
        // Show empty array while loading or if no service selected
        if (!selectedService || isLoadingAvailability) {
            return [];
        }
        
        if (serviceAvailability.length === 0) {
            return [];
        }
        
        const days: DateOption[] = [];
        const base = moment().tz(userTimeZone).startOf("day");
        
        // Group availability slots by date
        const slotsByDate = new Map<string, AvailabilitySlot[]>();
        for (const slot of serviceAvailability) {
            const slotStartMs = timestampToMillis(slot.start);
            const slotDate = moment.tz(slotStartMs, userTimeZone).format("DD/MM/YY");
            if (!slotsByDate.has(slotDate)) {
                slotsByDate.set(slotDate, []);
            }
            slotsByDate.get(slotDate)!.push(slot);
        }
        
        for (let i = 0; i < 7; i++) {
            const d = base.clone().add(i, "day");
            const dateStr = d.format("DD/MM/YY");
            const slotsForDate = slotsByDate.get(dateStr) ?? [];
            const hasAvailableSlots = slotsForDate.length > 0;
            
            const isToday = i === 0;
            const isTomorrow = i === 1;
            const dayLabel = isToday ? t("today") : isTomorrow ? t("tomorrow") : t(`weekday${d.day()}` as unknown as any);
            days.push({ date: dateStr, day: dayLabel, available: hasAvailableSlots });
        }
        return days;
    }, [selectedService, serviceAvailability, isLoadingAvailability, t, userTimeZone]);

    const availableTimes: TimeOption[] = useMemo(() => {
        // Show empty array while loading or if no date/service selected
        if (!selectedDate || !selectedServiceData || isLoadingAvailability) {
            return [] as TimeOption[];
        }
        
        if (serviceAvailability.length === 0) {
            return [] as TimeOption[];
        }
        
        const d = moment.tz(selectedDate, "DD/MM/YY", userTimeZone);
        const dateStr = d.format("DD/MM/YY");
        const stepMin = 30;
        const durationMin = selectedServiceData.durationMin;
        const paddingBefore = selectedServiceData.paddingBefore || 0;
        const paddingAfter = selectedServiceData.paddingAfter || 0;
        const totalDurationMin = durationMin + paddingBefore + paddingAfter;
        
        // Get all availability slots for the selected date
        const slotsForDate = serviceAvailability.filter((slot) => {
            const slotStartMs = timestampToMillis(slot.start);
            const slotDate = moment.tz(slotStartMs, userTimeZone).format("DD/MM/YY");
            return slotDate === dateStr;
        });
        
        if (slotsForDate.length === 0) {
            return [];
        }
        
        const times: TimeOption[] = [];
        const startOfDay = d.clone().hour(6).minute(0);
        const endOfDay = d.clone().hour(22).minute(0);
        
        for (let m = startOfDay.clone(); m.isBefore(endOfDay); m.add(stepMin, "minute")) {
            const startMs = m.valueOf();
            const endMs = m.clone().add(totalDurationMin, "minute").valueOf();
            
            // Check if this time slot fits within any availability slot
            const fitsInSlot = slotsForDate.some((slot) => {
                const slotStartMs = timestampToMillis(slot.start);
                const slotEndMs = timestampToMillis(slot.end);
                // Check if the requested time slot (with padding) fits completely within the availability slot
                return startMs >= slotStartMs && endMs <= slotEndMs;
            });
            
            // Also guard against already-booked calendar events (covers stale availability cache).
            if (fitsInSlot && hasFreeSlot(startMs, endMs)) {
                times.push({ time: m.format("HH:mm"), available: true });
            }
        }
        
        return times;
    }, [selectedDate, selectedServiceData, serviceAvailability, isLoadingAvailability, eventBlocksForDate, userTimeZone]);

    const customerAppointments = useMemo<Array<CalendarEvent & { id: string }>>(() => {
        if (!user?.id) return [];
        const events = ((currentBusiness?.calendar as CalendarEvent[] | undefined) ?? fallbackCalendar) as CalendarEvent[];
        const nowMs = Date.now();
        return events
            .filter((event) => event.businessId === businessId && event.userId === user.id && event.type === "APPOINTMENT")
            .filter((event) => event.status === "BOOKED" || event.status === "CONFIRMED")
            .filter((event) => timestampToMillis(event.end) >= nowMs)
            .filter((event): event is CalendarEvent & { id: string } => Boolean(event.id))
            .filter((event) => !cancelledAppointmentIds.includes(event.id))
            .sort((a, b) => timestampToMillis(a.start) - timestampToMillis(b.start));
    }, [businessId, cancelledAppointmentIds, currentBusiness?.calendar, fallbackCalendar, user?.id]);

    const totalPrice = selectedServiceData?.price || 0;

    const handleNext = () => {
        if (step < 4) setStep(step + 1);
        setTimeout(() => {
            const scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
            window.scrollTo({ top: scrollHeight, behavior: "smooth" });
        }, 100);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const clearBookingError = () => {
        if (bookingError) {
            setBookingError(null);
        }
    };

    const setSelectedService = (id: string | null) => {
        clearBookingError();
        // Clear date and time when service is changed or cleared
        if (id !== selectedService) {
            setSelectedDateState("");
            setSelectedTimeState("");
        }
        setSelectedServiceState(id);
    };

    const setSelectedDate = (date: string) => {
        clearBookingError();
        setSelectedDateState(date);
    };

    const setSelectedTime = (time: string) => {
        clearBookingError();
        setSelectedTimeState(time);
    };

    const handleBooking = async (): Promise<void> => {
        if (isBooking) return;
        if (!selectedServiceData || !selectedServiceData.id) {
            setBookingError(t("bookingErrorSelectService"));
            return;
        }
        if (!selectedDate || !selectedTime) {
            setBookingError(t("bookingErrorSelectSlot"));
            return;
        }
        if (!user?.id) {
            setBookingError(t("bookingLoginRequired"));
            return;
        }

        // Parse the selected date and time in the user's timezone, then convert to UTC
        const startMoment = moment.tz(`${selectedDate} ${selectedTime}`, "DD/MM/YY HH:mm", userTimeZone);
        if (!startMoment.isValid()) {
            setBookingError(t("bookingErrorGeneric"));
            return;
        }

        // Convert to UTC milliseconds for storage
        const startMs = startMoment.utc().valueOf();
        const endMs = startMoment.clone().add(selectedServiceData.durationMin, "minute").utc().valueOf();
        const trimmedNotes = customerInfo.notes?.trim();

        setIsBooking(true);
        setBookingError(null);

        try {
            const payload: Record<string, unknown> = {
                businessId,
                userId: user.id,
                serviceId: selectedServiceData.id,
                start: startMs,
                end: endMs,
                source: "web",
                type: "APPOINTMENT",
            };

            if (trimmedNotes) {
                payload.notes = trimmedNotes;
            }

            const result = await apiCall<{ calendarEventId: string }>("POST", "actions", "businesses/appointments/create", payload);

            const calendarEventId = result?.calendarEventId;
            if (!calendarEventId) {
                throw new ApiError("Missing calendarEventId in response");
            }

            if (!currentBusiness) {
                const nowTs = Timestamp.now();
                const newEvent = {
                    id: calendarEventId,
                    businessId,
                    userId: user.id,
                    serviceId: selectedServiceData.id,
                    type: "APPOINTMENT",
                    status: "BOOKED",
                    title: selectedServiceData.name,
                    start: Timestamp.fromMillis(startMs),
                    end: Timestamp.fromMillis(endMs),
                    source: "web",
                    created: nowTs,
                    timestamp: nowTs,
                } as CalendarEvent;

                if (trimmedNotes) {
                    newEvent.notes = trimmedNotes;
                }

                setFallbackCalendar((prev) => [...prev, newEvent]);
            }

            setStep(4);
        } catch (error) {
            const fallbackMessage = t("bookingErrorGeneric");
            const rawMessage = error instanceof Error ? error.message : "";
            const normalized = rawMessage.toLowerCase();
            let resolvedMessage = rawMessage;

            if (!rawMessage) {
                resolvedMessage = fallbackMessage;
            } else if (normalized.includes("slot") && normalized.includes("booked")) {
                resolvedMessage = t("bookingSlotTaken");
            } else if (normalized.includes("service") && normalized.includes("not")) {
                resolvedMessage = t("bookingErrorServiceNotFound");
            } else if (normalized.includes("auth") || normalized.includes("permission") || normalized.includes("unauthor")) {
                resolvedMessage = t("bookingLoginRequired");
            } else if (normalized.includes("calendar") && normalized.includes("missing")) {
                resolvedMessage = fallbackMessage;
            }

            if (!resolvedMessage || resolvedMessage === rawMessage) {
                resolvedMessage = fallbackMessage;
            }

            setBookingError(resolvedMessage);
        } finally {
            setIsBooking(false);
        }
    };

    const handleCancelAppointment = async (calendarEventId: string): Promise<void> => {
        if (!calendarEventId || isCancellingAppointment) return;

        setIsCancellingAppointment(true);
        setCancellingAppointmentId(calendarEventId);
        setCancelError(null);

        try {
            await apiCall("POST", "actions", "businesses/appointments/cancel", { calendarEventId });
            setCancelledAppointmentIds((prev) => (prev.includes(calendarEventId) ? prev : [...prev, calendarEventId]));

            if (!currentBusiness) {
                setFallbackCalendar((prev) =>
                    prev.map((event) => (event.id === calendarEventId ? { ...event, status: "CANCELLED" } : event))
                );
            }
        } catch (error) {
            console.error("Error cancelling appointment:", error);
            setCancelError(t("bookingErrorGeneric"));
        } finally {
            setIsCancellingAppointment(false);
            setCancellingAppointmentId(null);
        }
    };

    return {
        // data
        business,
        services,
        selectedService,
        setSelectedService,
        selectedServiceData,
        availableDates,
        availableTimes,
        totalPrice,
        // selection state
        selectedDate,
        setSelectedDate,
        selectedTime,
        setSelectedTime,
        // navigation
        step,
        handleNext,
        handleBack,
        handleBooking,
        isBooking,
        bookingError,
        cancelError,
        // customer
        customerInfo,
        setCustomerInfo,
        customerAppointments,
        // loading state
        isLoadingAvailability,
        isCancellingAppointment,
        cancellingAppointmentId,
        handleCancelAppointment,
    } as const;
}
