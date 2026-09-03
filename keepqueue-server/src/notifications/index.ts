import { db, firebaseTimestamp } from "../firebase";
import { logger } from "../managers";
import { Business, CalendarEvent, NotificationLog, Service, User } from "../types";

/**
 * Email delivery, and the record of every attempt.
 *
 * Resend is called over plain HTTPS rather than through an SDK — one POST is not worth a
 * dependency in a server that holds Firebase admin credentials.
 *
 * Delivery is optional by design: with no `resend_api_key` configured the attempt is still
 * written to notification_logs with status FAILED and a "not configured" reason, so the feature
 * can be developed, deployed and inspected before anyone signs up to a provider. Set
 * `resend_api_key` and `notification_from` to turn it on.
 *
 * Nothing here may break a booking. Every entry point swallows its own errors after logging.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export const isEmailConfigured = (): boolean => !!process.env.resend_api_key && !!process.env.notification_from;

const writeLog = async (entry: Omit<NotificationLog, "id" | "created" | "timestamp">, id?: string) => {
    const now = firebaseTimestamp();
    const ref = id ? db.collection("notification_logs").doc(id) : db.collection("notification_logs").doc();
    await ref.set({ ...entry, id: ref.id, created: now, timestamp: now });
};

/**
 * @param logId when given, the log document is created with this exact id and the write fails
 *              if it already exists. That is what stops a restarted reminder sweep from sending
 *              the same reminder twice — the id is the idempotency key.
 */
export const sendEmail = async (args: {
    to: string;
    subject: string;
    body: string;
    businessId: string;
    templateKey: string;
    logId?: string;
}): Promise<boolean> => {
    const { to, subject, body, businessId, templateKey, logId } = args;

    if (!to) return false;

    if (logId) {
        // create() rejects when the document exists, which is the whole point: the reminder for
        // a given appointment is claimed once, by whoever gets there first.
        try {
            await db.collection("notification_logs").doc(logId).create({
                businessId,
                type: "email",
                to,
                messageTemplateId: templateKey,
                content: subject,
                status: "QUEUED",
                sentAt: firebaseTimestamp(),
                id: logId,
                created: firebaseTimestamp(),
                timestamp: firebaseTimestamp(),
            });
        } catch {
            return false;
        }
    }

    if (!isEmailConfigured()) {
        const note = "email delivery is not configured (set resend_api_key and notification_from)";
        logger.warn(`notification skipped: ${note}`, { to, subject });
        if (logId) {
            await db.collection("notification_logs").doc(logId).update({ status: "FAILED", error: note }).catch(() => undefined);
        } else {
            await writeLog({
                businessId,
                type: "email",
                to,
                messageTemplateId: templateKey,
                content: subject,
                status: "FAILED",
                sentAt: firebaseTimestamp(),
                error: note,
            }).catch(() => undefined);
        }
        return false;
    }

    try {
        const response = await fetch(RESEND_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.resend_api_key}` },
            body: JSON.stringify({ from: process.env.notification_from, to: [to], subject, text: body }),
        });
        const ok = response.ok;
        const error = ok ? undefined : `provider responded ${response.status}`;
        if (logId) {
            await db.collection("notification_logs").doc(logId).update({ status: ok ? "SENT" : "FAILED", ...(error ? { error } : {}) });
        } else {
            await writeLog({
                businessId,
                type: "email",
                to,
                messageTemplateId: templateKey,
                content: subject,
                status: ok ? "SENT" : "FAILED",
                sentAt: firebaseTimestamp(),
                ...(error ? { error } : {}),
            });
        }
        if (!ok) logger.error("notification provider rejected the message", { status: response.status });
        return ok;
    } catch (error) {
        logger.error("notification send failed", error);
        if (logId) await db.collection("notification_logs").doc(logId).update({ status: "FAILED", error: String(error) }).catch(() => undefined);
        return false;
    }
};

const formatWhen = (event: CalendarEvent, business: Business): string => {
    const zone = business.timezone || "Asia/Jerusalem";
    return new Intl.DateTimeFormat(business.lang === "en" ? "en-GB" : "he-IL", {
        dateStyle: "full",
        timeStyle: "short",
        timeZone: zone,
    }).format(event.start.toDate());
};

const isHebrew = (business: Business) => business.lang !== "en";

export const appointmentConfirmationMessage = (event: CalendarEvent, business: Business, service?: Service) => {
    const when = formatWhen(event, business);
    const what = service?.name ?? event.title;
    return isHebrew(business)
        ? {
              subject: `אישור תור ב${business.name}`,
              body: `התור שלך ל${what} נקבע ל${when}.\n\n${business.name}\n${business.phone ?? ""}`,
          }
        : {
              subject: `Your appointment at ${business.name}`,
              body: `Your ${what} appointment is booked for ${when}.\n\n${business.name}\n${business.phone ?? ""}`,
          };
};

export const appointmentReminderMessage = (event: CalendarEvent, business: Business, service?: Service) => {
    const when = formatWhen(event, business);
    const what = service?.name ?? event.title;
    return isHebrew(business)
        ? { subject: `תזכורת: תור מחר ב${business.name}`, body: `תזכורת — התור שלך ל${what} מחר, ${when}.\n\n${business.name}` }
        : { subject: `Reminder: your appointment at ${business.name}`, body: `A reminder that your ${what} appointment is on ${when}.\n\n${business.name}` };
};

export const appointmentCancelledMessage = (event: CalendarEvent, business: Business, service?: Service) => {
    const when = formatWhen(event, business);
    const what = service?.name ?? event.title;
    return isHebrew(business)
        ? { subject: `התור ב${business.name} בוטל`, body: `התור שלך ל${what} ב${when} בוטל.\n\n${business.name}` }
        : { subject: `Your appointment at ${business.name} was cancelled`, body: `Your ${what} appointment on ${when} has been cancelled.\n\n${business.name}` };
};

/** Fire and forget: a booking must never fail because an email did not go out. */
export const notifyInBackground = (task: () => Promise<unknown>) => {
    void task().catch((error) => logger.error("notification task failed", error));
};

export const recipientFor = (user: User | undefined): string | undefined => {
    if (!user) return undefined;
    if (user.contacts && user.contacts.email === false) return undefined;
    return user.email || undefined;
};
