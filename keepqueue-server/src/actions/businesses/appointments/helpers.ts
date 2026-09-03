import { Timestamp } from "firebase-admin/firestore";
import { cacheManager } from "../../../managers";
import { db } from "../../../firebase";
import { AvailabilitySlot, Business, CalendarEvent, OperationSchedule, StaffMember, TS } from "../../../types";
import moment from "moment-timezone";

export const TERMINAL_STATUSES: CalendarEvent["status"][] = ["CANCELLED", "DONE", "NO_SHOW"];

export const parseTs = (value: number): Timestamp => {
    return Timestamp.fromMillis(value);
};

export const getServiceById = (serviceId?: string) => {
    if (!serviceId) return null;
    const servicesMap = cacheManager.get("servicesMap", new Map());
    return servicesMap.get(serviceId) || null;
};

/**
 * A booking has to last exactly as long as the service it books.
 *
 * Overlap detection blocks on any non-terminal event, so an appointment is a blocking event
 * too: without this bound a customer could book one "appointment" running ninety days and
 * empty the business's calendar just as effectively as a forged vacation. A minute of slack
 * absorbs clock skew between the browser and the server.
 */
export const DURATION_SLACK_MS = 60 * 1000;

export const durationMismatch = (startMs: number, endMs: number, durationMin: number): boolean =>
    Math.abs(endMs - startMs - durationMin * 60 * 1000) > DURATION_SLACK_MS;

/**
 * Writes go to Firestore and reach the cache later, through the snapshot listener. Everything
 * that reads back — requireRecordAccess, businessIdFrom.calendarEvent, overlap detection,
 * availability — reads the cache, so between the commit and the listener a just-booked
 * appointment does not exist as far as the API is concerned: rescheduling it answers 404 and
 * its slot still looks free. Merging the event in here closes that window.
 *
 * This narrows the double-booking race (BUG-43) but does not end it: two requests that both
 * check before either writes still both pass. That needs the overlap check inside the
 * transaction, which is a separate change.
 */
export const cacheCalendarEvent = (event: Partial<CalendarEvent> & { id: string }) => {
    const existing = (cacheManager.get("calendarMap", new Map()) as Map<string, CalendarEvent>).get(event.id);
    const merged = { ...(existing ?? {}), ...event } as CalendarEvent;
    cacheManager.set("calendar", [merged], { merge: true, replacePrevValues: true });
    cacheManager.set("calendarMap", [merged], { merge: true, replacePrevValues: true });
};

/**
 * Overlap detection that Firestore can actually arbitrate.
 *
 * The cache-based check cannot prevent a double booking: two requests both read a cache that
 * neither has written to yet, both see a free slot, and both commit. Reading the candidates
 * through `tx.get` instead puts them in the transaction's read set, so Firestore aborts and
 * retries the loser — the conflict is detected by the database rather than hoped away.
 *
 * The query filters on `end > start` rather than on the new event's start range, because a
 * vacation block opened weeks earlier still overlaps today and a range on `start` would miss
 * it. Filtering by `end` also drops every finished appointment, which keeps the read small.
 *
 * Needs the composite index on (businessId, end) in firestore.indexes.json.
 */
/**
 * Whether a requested window sits inside the hours the business actually works.
 *
 * Availability was computed for the booking page and then never consulted again, so the only
 * server-side constraint on a booking's time was that it did not overlap something else — a
 * caller talking to the API directly could book 03:00 on a Saturday. This re-derives the free
 * intervals and requires the window to fall entirely inside one of them.
 *
 * `computeBusinessAvailability` already subtracts existing events, so a slot free of overlap is
 * a slot inside working hours AND unbooked; overlap is still checked separately inside the
 * transaction, which is what makes it race-safe.
 */
export const isWithinBusinessHours = (
    business: Business,
    operationSchedule: OperationSchedule[],
    start: Timestamp,
    end: Timestamp,
    staffId?: string,
): boolean => {
    const startMs = start.toMillis();
    const endMs = end.toMillis();
    // A window that reaches a minute back is enough to cover the slot the caller was offered a
    // moment ago; computeBusinessAvailability clamps its first slot to "now".
    const from = Timestamp.fromMillis(startMs - MINUTE_MS);
    const to = Timestamp.fromMillis(endMs + MINUTE_MS);
    return computeBusinessAvailability(business, operationSchedule, from, to, staffId).some(
        (slot) => slot.start.toMillis() <= startMs && slot.end.toMillis() >= endMs,
    );
};

/** The schedule a service is bookable on: its own if it defines one, the business's otherwise. */
export const scheduleForService = (business: Business, service?: { operationSchedule?: OperationSchedule[] } | null): OperationSchedule[] =>
    service?.operationSchedule && service.operationSchedule.length > 0 ? service.operationSchedule : business.operationSchedule ?? [];

/**
 * The staff who may perform a service: active, belonging to the business, and either explicitly
 * assigned to that service or unrestricted. An empty `serviceIds` means "anything" rather than
 * "nothing" — the staff form has never had a service picker, so every existing record has it
 * empty and reading it strictly would make all of them ineligible.
 */
export const eligibleStaffForService = (businessId: string, serviceId?: string): StaffMember[] => {
    const staff = cacheManager.get("staff", []) as StaffMember[];
    return staff.filter(
        (member) =>
            member.businessId === businessId &&
            member.isActive !== false &&
            (!serviceId || !member.serviceIds || member.serviceIds.length === 0 || member.serviceIds.includes(serviceId)),
    );
};

/** A staff member's own schedule if they keep one, the business's hours otherwise. */
export const scheduleForStaff = (business: Business, member: StaffMember): OperationSchedule[] =>
    member.operationSchedule && member.operationSchedule.length > 0 ? member.operationSchedule : business.operationSchedule ?? [];

/**
 * The first eligible staff member free for the whole window.
 *
 * A business with staff is not one resource but several, so "is this slot free" has no answer
 * until a person is named. When the customer does not pick one, the server picks for them here
 * — inside the booking transaction, so the choice cannot go stale between check and write.
 */
export const findFreeStaff = (
    business: Business,
    serviceId: string | undefined,
    start: Timestamp,
    end: Timestamp,
    preferredStaffId?: string,
): StaffMember | null => {
    const candidates = eligibleStaffForService(business.id!, serviceId);
    const pool = preferredStaffId ? candidates.filter((member) => member.id === preferredStaffId) : candidates;
    return pool.find((member) => isWithinBusinessHours(business, scheduleForStaff(business, member), start, end, member.id)) ?? null;
};

/**
 * Availability across every eligible staff member, merged into one list of slots. A customer
 * choosing a time should see it offered while anybody can take it, not only while everybody can.
 */
export const mergeSlots = (slots: AvailabilitySlot[]): AvailabilitySlot[] => {
    const sorted = [...slots].sort((a, b) => a.start.toMillis() - b.start.toMillis());
    const merged: AvailabilitySlot[] = [];
    for (const slot of sorted) {
        const last = merged[merged.length - 1];
        if (last && slot.start.toMillis() <= last.end.toMillis()) {
            if (slot.end.toMillis() > last.end.toMillis()) merged[merged.length - 1] = { start: last.start, end: slot.end };
            continue;
        }
        merged.push({ start: slot.start, end: slot.end });
    }
    return merged;
};

export const findOverlappingEvent = async (
    tx: FirebaseFirestore.Transaction,
    businessId: string,
    start: Timestamp,
    end: Timestamp,
    excludeEventId?: string,
    staffId?: string,
): Promise<CalendarEvent | null> => {
    const snap = await tx.get(db.collection("calendar").where("businessId", "==", businessId).where("end", ">", start));

    for (const docSnap of snap.docs) {
        if (excludeEventId && docSnap.id === excludeEventId) continue;
        const event = docSnap.data() as CalendarEvent;
        if (TERMINAL_STATUSES.includes(event.status)) continue;
        // Two staff can hold the same hour, so a conflict is only a conflict for the same
        // person. An event with no staffId is a business-wide closure and conflicts with all.
        if (staffId && event.staffId && event.staffId !== staffId) continue;
        if (event.start.toMillis() < end.toMillis()) return { ...event, id: docSnap.id };
    }
    return null;
};

export const isOverlap = (startA: Timestamp, endA: Timestamp, startB: Timestamp, endB: Timestamp): boolean => {
    return endA.toMillis() > startB.toMillis() && startA.toMillis() < endB.toMillis();
};

export const hasCalendarOverlapInCache = (businessId: string, start: Timestamp, end: Timestamp, excludeEventId?: string): boolean => {
    const calendarEvents = cacheManager.get("calendar", []);
    return calendarEvents.some((event) => {
        if (event.businessId !== businessId) return false;
        if (excludeEventId && event.id === excludeEventId) return false;
        if (TERMINAL_STATUSES.includes(event.status)) return false;
        return isOverlap(event.start, event.end, start, end);
    });
};

const MINUTE_MS = 60 * 1000;

const toMidnight = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

const addDays = (date: Date, days: number): Date => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
};

const makeTs = (ms: number): TS => Timestamp.fromMillis(ms);

const subtractBusyFromInterval = (
    freeStart: number,
    freeEnd: number,
    busyIntervals: { start: number; end: number }[],
): { start: number; end: number }[] => {
    if (freeEnd <= freeStart) return [];
    if (busyIntervals.length === 0) return [{ start: freeStart, end: freeEnd }];

    const busySorted = [...busyIntervals]
        .filter((b) => b.end > freeStart && b.start < freeEnd)
        .sort((a, b) => a.start - b.start);

    const result: { start: number; end: number }[] = [];
    let cursor = freeStart;

    for (const b of busySorted) {
        if (b.start > cursor) {
            result.push({ start: cursor, end: Math.min(b.start, freeEnd) });
        }
        if (b.end > cursor) {
            cursor = Math.max(cursor, b.end);
        }
        if (cursor >= freeEnd) break;
    }

    if (cursor < freeEnd) {
        result.push({ start: cursor, end: freeEnd });
    }
    return result.filter((i) => i.end > i.start);
};

/**
 * @param staffId when given, only this person's own bookings block them — that is what lets two
 *                staff take appointments at the same time. An event with no staffId is either a
 *                business-wide closure or a booking made before staff scheduling existed, and
 *                blocks everybody either way.
 */
const getBlockingEventsForDay = (businessId: string, dayStartMs: number, dayEndMs: number, staffId?: string): { start: number; end: number }[] => {
    const events: CalendarEvent[] = cacheManager.get("calendar", []);
    return events
        .filter((e) => {
            if (e.businessId !== businessId) return false;
            if (TERMINAL_STATUSES.includes(e.status)) return false;
            if (staffId && e.staffId && e.staffId !== staffId) return false;
            const s = e.start.toMillis();
            const en = e.end.toMillis();
            return en > dayStartMs && s < dayEndMs;
        })
        .map((e) => ({ start: e.start.toMillis(), end: e.end.toMillis() }));
};

const buildDailyFreeIntervals = (
    dayStartMs: number,
    weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6,
    operationSchedule: OperationSchedule[],
): { start: number; end: number }[] => {
    const dayRules = operationSchedule.find((r) => r.day === weekday);
    if (!dayRules || !dayRules.intervals || dayRules.intervals.length === 0) return [];

    return dayRules.intervals
        .filter((tr) => tr.endMin > tr.startMin)
        .map((tr) => ({ start: dayStartMs + tr.startMin * MINUTE_MS, end: dayStartMs + tr.endMin * MINUTE_MS }));
};

export const computeBusinessAvailability = (
    business: Business,
    operationSchedule: OperationSchedule[],
    fromTs?: TS,
    toTs?: TS,
    staffId?: string,
): AvailabilitySlot[] => {
    const tz: string = business?.timezone || "Asia/Jerusalem";
    const nowMs = Date.now();
    const fromMs = fromTs ? fromTs.toMillis() : nowMs;
    const toMs = toTs ? toTs.toMillis() : nowMs + 90 * 24 * 60 * MINUTE_MS;
    // The cursor below snaps to the start of the day, so today would otherwise offer slots that
    // already ended. A caller asking for a future window keeps its own start.
    const earliestMs = Math.max(fromMs, nowMs);

    // Iterate days in the BUSINESS timezone to avoid hour shifts (DST/UTC).
    let cursor = moment.tz(fromMs, tz).startOf("day");
    const endDate = moment.tz(toMs, tz).startOf("day");

    const availability: AvailabilitySlot[] = [];
    while (cursor.valueOf() <= endDate.valueOf()) {
        const dayStartMs = cursor.valueOf();
        const dayEndMs = cursor.clone().add(1, "day").valueOf();
        const weekday = cursor.day() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
        const dailyFree = buildDailyFreeIntervals(dayStartMs, weekday, operationSchedule);
        if (dailyFree.length > 0) {
            const busy = getBlockingEventsForDay(business.id!, dayStartMs, dayEndMs, staffId);
            for (const free of dailyFree) {
                const remaining = subtractBusyFromInterval(free.start, free.end, busy);
                for (const r of remaining) {
                    const start = Math.max(r.start, earliestMs);
                    if (start >= r.end) continue;
                    availability.push({ start: makeTs(start), end: makeTs(r.end) });
                }
            }
        }
        cursor = cursor.clone().add(1, "day");
    }

    return availability;
};
