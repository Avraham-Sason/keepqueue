import { cacheManager, logger } from "../managers";
import { Business, CalendarEvent, Service, User } from "../types";
import { appointmentReminderMessage, recipientFor, sendEmail } from "./index";

/**
 * The day-before reminder.
 *
 * A sweep over the in-memory cache on an interval, not a job queue: the cache already holds
 * every appointment, the send is idempotent through a deterministic log id, and a pilot does not
 * need infrastructure it cannot yet justify.
 *
 * ponytail: single-process. A second instance would sweep in parallel — harmless, because the
 * log-id claim makes a duplicate send impossible — but the sweep itself would run twice. Move to
 * a scheduler if this is ever scaled out.
 */

const SWEEP_INTERVAL_MS = 15 * 60 * 1000;
const REMINDER_LEAD_MS = 24 * 60 * 60 * 1000;
// The window has to be wider than the sweep interval or an appointment can fall between two
// sweeps and never be reminded about.
const WINDOW_MS = SWEEP_INTERVAL_MS * 2;

export const dueForReminder = (event: CalendarEvent, nowMs: number): boolean => {
    if (event.type !== "APPOINTMENT") return false;
    if (event.status !== "BOOKED" && event.status !== "CONFIRMED") return false;
    const untilStart = event.start.toMillis() - nowMs;
    return untilStart <= REMINDER_LEAD_MS && untilStart > REMINDER_LEAD_MS - WINDOW_MS;
};

export const sweepReminders = async (nowMs: number = Date.now()): Promise<number> => {
    const events = cacheManager.get("calendar", []) as CalendarEvent[];
    const businesses = cacheManager.get("businessesMap", new Map()) as Map<string, Business>;
    const services = cacheManager.get("servicesMap", new Map()) as Map<string, Service>;
    const users = cacheManager.get("usersMap", new Map()) as Map<string, User>;

    let sent = 0;
    for (const event of events) {
        if (!dueForReminder(event, nowMs)) continue;

        const business = businesses.get(event.businessId);
        const to = recipientFor(users.get(event.userId));
        if (!business || !to) continue;

        const { subject, body } = appointmentReminderMessage(event, business, event.serviceId ? services.get(event.serviceId) : undefined);
        const ok = await sendEmail({
            to,
            subject,
            body,
            businessId: event.businessId,
            templateKey: "appointment_reminder",
            logId: `${event.id}_reminder`,
        });
        if (ok) sent++;
    }
    return sent;
};

let timer: NodeJS.Timeout | undefined;

export const startReminderSweep = () => {
    if (timer) return;
    timer = setInterval(() => {
        sweepReminders().catch((error) => logger.error("reminder sweep failed", error));
    }, SWEEP_INTERVAL_MS);
    // Nothing should be kept alive by this timer: shutdown drains HTTP, not reminders.
    timer.unref();
};

export const stopReminderSweep = () => {
    if (timer) clearInterval(timer);
    timer = undefined;
};
