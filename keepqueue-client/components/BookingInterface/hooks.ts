"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthStore, useBusinessesStore, useSettingsStore } from "@/lib/store";
import type { AvailabilitySlot, CalendarEvent, ReviewWithUser, Service, StaffMember } from "@/lib/types";
import { timestampToMillis } from "@/lib/helpers/time";
import moment from "moment-timezone";
import { useLanguage } from "@/hooks";
import { apiCall, ApiError } from "@/lib/helpers/api";
import { formatWorkingHoursFromSchedule } from "@/lib/helpers/schedule";

const MS_PER_MINUTE = 60 * 1000;
const SLOT_STEP_MIN = 30;
const BOOKING_WINDOW_DAYS = 7;
const DATE_FORMAT = "DD/MM/YY";
// The server falls back to this zone when a business has no `timezone`, and it computes the
// availability slots in it — the open/closed badge has to agree with those slots.
const FALLBACK_BUSINESS_TIME_ZONE = "Asia/Jerusalem";

export interface DateOption {
    date: string;
    day: string;
    available: boolean;
}
export interface TimeOption {
    time: string;
    available: boolean;
    startMs: number;
}

export interface BusinessDisplay {
    name: string;
    rating: number;
    reviews: number;
    address: string;
    phone: string;
    image?: string;
    description: string;
    workingHours: string;
    isOpenNow: boolean | null;
}

export interface CustomerInfo {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    notes: string;
}

const resolveBookingErrorMessage = (error: unknown, t: (key: string) => string): string => {
    const generic = t("bookingErrorGeneric");
    if (!(error instanceof Error)) return generic;

    const raw = error.message?.trim() ?? "";
    const status = error instanceof ApiError ? error.status : undefined;
    const normalized = raw.toLowerCase();

    if (status === 409) return t("bookingSlotTaken");
    if (status === 403) return t("bookingBlockedByBusiness");
    if (status === 401) return t("bookingLoginRequired");
    if (normalized.includes("past")) return t("bookingErrorPastTime");
    if (normalized.includes("opening hours")) return t("bookingErrorOutsideHours");
    if (normalized.includes("service")) return t("bookingErrorServiceNotFound");
    return raw || generic;
};

export function useBookingState(businessId: string) {
    const { t } = useLanguage();
    // The store is global and survives navigation, so on another business's booking page it
    // can still hold the previously-viewed one until this page's fetch lands. Scoping it here
    // keeps every consumer below from rendering — or booking against — the wrong business.
    const storedBusiness = useBusinessesStore.currentBusiness();
    const currentBusiness = storedBusiness?.id === businessId ? storedBusiness : null;
    const user = useAuthStore.user();
    const userTimeZone = useSettingsStore.userTimeZone();

    const [selectedService, setSelectedServiceState] = useState<string | null>(null);
    const [selectedStaffId, setSelectedStaffIdState] = useState<string | null>(null);
    const [selectedDate, setSelectedDateState] = useState<string>("");
    const [selectedTime, setSelectedTimeState] = useState<string>("");
    const [step, setStep] = useState<number>(1);
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ firstName: "", lastName: "", phone: "", email: "", notes: "" });
    const [isBooking, setIsBooking] = useState<boolean>(false);
    const [bookingError, setBookingError] = useState<string | null>(null);
    const [serviceAvailability, setServiceAvailability] = useState<AvailabilitySlot[]>([]);
    const [isLoadingAvailability, setIsLoadingAvailability] = useState<boolean>(false);
    const [availabilityError, setAvailabilityError] = useState<string | null>(null);
    const [isCancellingAppointment, setIsCancellingAppointment] = useState<boolean>(false);
    const [cancellingAppointmentId, setCancellingAppointmentId] = useState<string | null>(null);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [cancelledAppointmentIds, setCancelledAppointmentIds] = useState<string[]>([]);

    const businessTimeZone = currentBusiness?.timezone || FALLBACK_BUSINESS_TIME_ZONE;

    // `useBusiness` keeps the fetch state to itself, so a business that never arrives — deleted,
    // switched off, or offline — is only observable as its continued absence.
    const [businessLoadFailed, setBusinessLoadFailed] = useState(false);
    useEffect(() => {
        if (currentBusiness) {
            setBusinessLoadFailed(false);
            return;
        }
        const timer = setTimeout(() => setBusinessLoadFailed(true), 8000);
        return () => clearTimeout(timer);
    }, [currentBusiness]);

    const workingHoursDisplay = useMemo(
        () => formatWorkingHoursFromSchedule(currentBusiness?.operationSchedule, (key: string) => t(key as any)),
        [currentBusiness?.operationSchedule, t]
    );

    const reviews = useMemo(() => {
        const list = (currentBusiness?.reviews ?? []) as ReviewWithUser[];
        return [...list].sort((a, b) => timestampToMillis(b.created) - timestampToMillis(a.created));
    }, [currentBusiness?.reviews]);

    const ratingSummary = useMemo(() => {
        if (reviews.length === 0) return { average: 0, count: 0 };
        const total = reviews.reduce((sum, review) => sum + (review.rating ?? 0), 0);
        return { average: Math.round((total / reviews.length) * 10) / 10, count: reviews.length };
    }, [reviews]);

    const isOpenNow = useMemo<boolean | null>(() => {
        const schedule = currentBusiness?.operationSchedule;
        if (!schedule || schedule.length === 0) return null;
        const now = moment().tz(businessTimeZone);
        const minuteOfDay = now.hours() * 60 + now.minutes();
        const today = schedule.find((entry) => Number(entry.day) === now.day());
        return Boolean(today?.intervals?.some((interval) => minuteOfDay >= interval.startMin && minuteOfDay < interval.endMin));
    }, [currentBusiness?.operationSchedule, businessTimeZone]);

    const business: BusinessDisplay = useMemo(
        () => ({
            name: currentBusiness?.name ?? "",
            rating: ratingSummary.average,
            reviews: ratingSummary.count,
            address: currentBusiness?.address ?? "",
            phone: currentBusiness?.phone ?? "",
            image: currentBusiness?.logoUrl,
            description: currentBusiness?.description ?? "",
            workingHours: workingHoursDisplay,
            isOpenNow,
        }),
        [currentBusiness, isOpenNow, ratingSummary, workingHoursDisplay]
    );

    const services: Service[] = useMemo(() => currentBusiness?.services ?? [], [currentBusiness?.services]);


    const staffOptions = useMemo(() => {
        const members = (currentBusiness?.staff ?? []) as StaffMember[];
        return members.filter(
            (member) =>
                member.isActive !== false &&
                (!selectedService || !member.serviceIds || member.serviceIds.length === 0 || member.serviceIds.includes(selectedService)),
        );
    }, [currentBusiness?.staff, selectedService]);

    // Choosing a different person changes which slots exist, so a time picked for someone else
    // cannot be carried over.
    const setSelectedStaffId = useCallback((staffId: string | null) => {
        setSelectedStaffIdState(staffId);
        setSelectedTimeState("");
    }, []);

    const selectedServiceData = useMemo(() => services.find((s) => s.id === selectedService), [services, selectedService]);

    // Availability is re-fetched on every entry to the date/time step: a slot offered when the
    // service was picked can be gone by the time the customer gets back to this step.
    useEffect(() => {
        if (!selectedService || step !== 2) return;
        let cancelled = false;

        const fetchAvailability = async () => {
            setIsLoadingAvailability(true);
            setAvailabilityError(null);
            try {
                const availability = await apiCall<AvailabilitySlot[]>("POST", "data", "getAvailabilityByServiceId", {
                    serviceId: selectedService,
                    ...(selectedStaffId ? { staffId: selectedStaffId } : {}),
                });
                if (cancelled) return;
                setServiceAvailability(availability ?? []);
            } catch (error) {
                if (cancelled) return;
                setServiceAvailability([]);
                setAvailabilityError(error instanceof Error && error.message ? error.message : t("availabilityLoadError"));
            } finally {
                if (!cancelled) setIsLoadingAvailability(false);
            }
        };

        fetchAvailability();
        return () => {
            cancelled = true;
        };
    }, [selectedService, selectedStaffId, step, t]);

    const busyRanges = useMemo(() => {
        const events = (currentBusiness?.calendar ?? []) as CalendarEvent[];
        return events
            .filter((event) => event.status !== "CANCELLED" && !(event.id && cancelledAppointmentIds.includes(event.id)))
            .map((event) => ({ start: timestampToMillis(event.start), end: timestampToMillis(event.end) }));
    }, [currentBusiness?.calendar, cancelledAppointmentIds]);

    // Every offered time is generated from an availability slot the server returned, so the grid
    // spans exactly the business's opening hours instead of a fixed window in the viewer's zone.
    const timeOptionsByDate = useMemo(() => {
        const byDate = new Map<string, TimeOption[]>();
        if (!selectedServiceData || serviceAvailability.length === 0) return byDate;

        const totalDurationMin =
            selectedServiceData.durationMin + (selectedServiceData.paddingBefore || 0) + (selectedServiceData.paddingAfter || 0);
        const totalDurationMs = totalDurationMin * MS_PER_MINUTE;
        const nowMs = Date.now();

        for (const slot of serviceAvailability) {
            const slotStartMs = timestampToMillis(slot.start);
            const slotEndMs = timestampToMillis(slot.end);
            for (let startMs = slotStartMs; startMs + totalDurationMs <= slotEndMs; startMs += SLOT_STEP_MIN * MS_PER_MINUTE) {
                if (startMs < nowMs) continue;
                const endMs = startMs + totalDurationMs;
                const isBusy = busyRanges.some((range) => Math.max(range.start, startMs) < Math.min(range.end, endMs));
                if (isBusy) continue;

                const startMoment = moment.tz(startMs, userTimeZone);
                const dateKey = startMoment.format(DATE_FORMAT);
                const time = startMoment.format("HH:mm");
                const options = byDate.get(dateKey) ?? [];
                if (options.some((option) => option.time === time)) continue;
                options.push({ time, available: true, startMs });
                byDate.set(dateKey, options);
            }
        }

        for (const options of byDate.values()) {
            options.sort((a, b) => a.startMs - b.startMs);
        }
        return byDate;
    }, [busyRanges, selectedServiceData, serviceAvailability, userTimeZone]);

    const availableDates: DateOption[] = useMemo(() => {
        if (!selectedService || isLoadingAvailability || timeOptionsByDate.size === 0) return [];

        const base = moment().tz(userTimeZone).startOf("day");
        const days: DateOption[] = [];
        for (let i = 0; i < BOOKING_WINDOW_DAYS; i++) {
            const day = base.clone().add(i, "day");
            const dateStr = day.format(DATE_FORMAT);
            const dayLabel = i === 0 ? t("today") : i === 1 ? t("tomorrow") : t(`weekday${day.day()}` as unknown as any);
            days.push({ date: dateStr, day: dayLabel, available: (timeOptionsByDate.get(dateStr)?.length ?? 0) > 0 });
        }
        return days;
    }, [isLoadingAvailability, selectedService, t, timeOptionsByDate, userTimeZone]);

    const availableTimes: TimeOption[] = useMemo(() => {
        if (!selectedDate || isLoadingAvailability) return [];
        return timeOptionsByDate.get(selectedDate) ?? [];
    }, [isLoadingAvailability, selectedDate, timeOptionsByDate]);

    // A refetch can retire the chosen time while the customer is still on the step that offered
    // it. Dropping the selection here is what keeps the confirm button from submitting it.
    useEffect(() => {
        if (step !== 2 || isLoadingAvailability || !selectedTime) return;
        if (availableTimes.some((option) => option.time === selectedTime)) return;
        setSelectedTimeState("");
    }, [availableTimes, isLoadingAvailability, selectedTime, step]);

    const customerAppointments = useMemo<Array<CalendarEvent & { id: string }>>(() => {
        if (!user?.id) return [];
        const events = (currentBusiness?.calendar ?? []) as CalendarEvent[];
        const nowMs = Date.now();
        return events
            .filter((event) => event.businessId === businessId && event.userId === user.id && event.type === "APPOINTMENT")
            .filter((event) => event.status === "BOOKED" || event.status === "CONFIRMED")
            .filter((event) => timestampToMillis(event.end) >= nowMs)
            .filter((event): event is CalendarEvent & { id: string } => Boolean(event.id))
            .filter((event) => !cancelledAppointmentIds.includes(event.id))
            .sort((a, b) => timestampToMillis(a.start) - timestampToMillis(b.start));
    }, [businessId, cancelledAppointmentIds, currentBusiness?.calendar, user?.id]);

    const totalPrice = selectedServiceData?.price || 0;

    // Browser Back has to walk the wizard, not leave it: each forward move pushes a history
    // entry carrying the step it opened.
    useEffect(() => {
        const onPopState = (event: PopStateEvent) => {
            const target = (event.state as { bookingStep?: number } | null)?.bookingStep;
            setStep((current) => (typeof target === "number" && target >= 1 && target <= 4 ? target : Math.max(1, current - 1)));
        };
        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, []);

    const goToStep = useCallback((next: number) => {
        setStep(next);
        window.history.pushState({ bookingStep: next }, "");
    }, []);

    const handleNext = () => {
        if (step < 4) goToStep(step + 1);
        setTimeout(() => {
            const scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
            window.scrollTo({ top: scrollHeight, behavior: "smooth" });
        }, 100);
    };

    const handleBack = () => {
        if (step <= 1) return;
        if ((window.history.state as { bookingStep?: number } | null)?.bookingStep) {
            window.history.back();
            return;
        }
        setStep(step - 1);
    };

    const clearBookingError = () => {
        if (bookingError) {
            setBookingError(null);
        }
    };

    const setSelectedService = (id: string | null) => {
        clearBookingError();
        if (id !== selectedService) {
            setSelectedDateState("");
            setSelectedTimeState("");
            setServiceAvailability([]);
            // The person chosen for the previous service may not perform this one.
            setSelectedStaffIdState(null);
        }
        setSelectedServiceState(id);
    };

    const setSelectedDate = (date: string) => {
        clearBookingError();
        if (date !== selectedDate) {
            setSelectedTimeState("");
        }
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

        const selectedOption = availableTimes.find((option) => option.time === selectedTime);
        if (!selectedOption) {
            setBookingError(t("bookingSlotNoLongerAvailable"));
            return;
        }

        const startMs = selectedOption.startMs;
        const endMs = startMs + selectedServiceData.durationMin * MS_PER_MINUTE;
        const trimmedNotes = customerInfo.notes?.trim();

        setIsBooking(true);
        setBookingError(null);

        try {
            const payload: Record<string, unknown> = {
                ...(selectedStaffId ? { staffId: selectedStaffId } : {}),
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

            if (!result?.calendarEventId) {
                throw new ApiError("Missing calendarEventId in response");
            }

            setStep(4);
            window.history.replaceState({ bookingStep: 4 }, "");
        } catch (error) {
            setBookingError(resolveBookingErrorMessage(error, t));
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
        } catch (error) {
            setCancelError(error instanceof Error && error.message ? error.message : t("bookingErrorGeneric"));
        } finally {
            setIsCancellingAppointment(false);
            setCancellingAppointmentId(null);
        }
    };

    return {
        // data
        business,
        isBusinessLoaded: Boolean(currentBusiness),
        businessLoadFailed,
        services,
        reviews,
        selectedService,
        setSelectedService,
        selectedServiceData,
        staffOptions,
        selectedStaffId,
        setSelectedStaffId,
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
        availabilityError,
        isCancellingAppointment,
        cancellingAppointmentId,
        handleCancelAppointment,
    } as const;
}
