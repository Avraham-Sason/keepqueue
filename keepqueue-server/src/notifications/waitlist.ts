import { cacheManager, logger } from "../managers";
import { Business, CalendarEvent, Service, User, WaitItem } from "../types";
import { notifyInBackground, recipientFor, sendEmail } from "./index";

/**
 * The half of the waiting list that makes it "smart": telling people when a slot opens.
 *
 * Without this the collection is only storage — a customer joins and nothing ever happens. A
 * cancellation is the moment a slot exists, so that is where the offer goes out.
 *
 * The offer is not a reservation. Everyone whose window covers the freed slot is told, and the
 * first to book gets it; the booking endpoint arbitrates that race properly. Reserving instead
 * would need an expiry and a release path, which is more machinery than a pilot has earned.
 */

const isLive = (item: WaitItem, nowMs: number) => item.expiresAt.toMillis() > nowMs;

export const matchesFreedSlot = (item: WaitItem, event: CalendarEvent, nowMs: number): boolean => {
    if (item.businessId !== event.businessId) return false;
    if (!isLive(item, nowMs)) return false;
    if (event.serviceId && item.serviceId !== event.serviceId) return false;
    // The freed slot has to fall inside the window the customer said they could make.
    return item.preferredWindow.from.toMillis() <= event.start.toMillis() && item.preferredWindow.to.toMillis() >= event.end.toMillis();
};

const offerMessage = (business: Business, event: CalendarEvent, service?: Service) => {
    const when = new Intl.DateTimeFormat(business.lang === "en" ? "en-GB" : "he-IL", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: business.timezone || "Asia/Jerusalem",
    }).format(event.start.toDate());
    const what = service?.name ?? event.title;
    return business.lang === "en"
        ? {
              subject: `A slot opened up at ${business.name}`,
              body: `A ${what} slot has become available on ${when}. It is offered first-come, first-served — book it before someone else does.\n\n${business.name}`,
          }
        : {
              subject: `התפנה תור ב${business.name}`,
              body: `התפנה תור ל${what} ב${when}. התור נתפס לפי סדר ההזמנות — כדאי להזדרז.\n\n${business.name}`,
          };
};

export const offerFreedSlotToWaitlist = async (event: CalendarEvent, nowMs: number = Date.now()): Promise<number> => {
    const waitlist = cacheManager.get("waitlist", []) as WaitItem[];
    const business = (cacheManager.get("businessesMap", new Map()) as Map<string, Business>).get(event.businessId);
    if (!business) return 0;

    const service = event.serviceId ? (cacheManager.get("servicesMap", new Map()) as Map<string, Service>).get(event.serviceId) : undefined;
    const users = cacheManager.get("usersMap", new Map()) as Map<string, User>;

    const matches = waitlist
        .filter((item) => matchesFreedSlot(item, event, nowMs))
        .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.created.toMillis() - b.created.toMillis());

    const { subject, body } = offerMessage(business, event, service);
    let sent = 0;
    for (const item of matches) {
        const to = recipientFor(users.get(item.userId));
        if (!to) continue;
        const ok = await sendEmail({
            to,
            subject,
            body,
            businessId: event.businessId,
            templateKey: "waitlist_slot_freed",
            // One offer per waiting customer per freed appointment, whatever else happens.
            logId: `${event.id}_${item.id}_waitlist`,
        });
        if (ok) sent++;
    }
    return sent;
};

export const offerFreedSlotInBackground = (event: CalendarEvent) => {
    notifyInBackground(async () => {
        const sent = await offerFreedSlotToWaitlist(event);
        if (sent) logger.log(`waitlist: offered a freed slot to ${sent} customer(s)`);
    });
};
