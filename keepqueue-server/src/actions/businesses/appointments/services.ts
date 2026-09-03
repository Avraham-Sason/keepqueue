import { AppError, conflict, jsonFailed, jsonOK, notFound } from "../../../helpers";
import { Business, CalendarEvent, RouterService, User } from "../../../types";
import { db, firebaseTimestamp } from "../../../firebase";
import { FieldValue } from "firebase-admin/firestore";
import { logAudit } from "../../../helpers/audit";
import { cacheManager, logger } from "../../../managers";
import {
    cacheCalendarEvent,
    durationMismatch,
    eligibleStaffForService,
    findFreeStaff,
    findOverlappingEvent,
    getServiceById,
    isWithinBusinessHours,
    parseTs,
    scheduleForService,
} from "./helpers";
import { CreateAppointmentModel, RescheduleAppointmentModel, UpdateAppointmentStatusModel } from "./schemes";
import { AuthenticatedRequest } from "../../../middlewares/authGuard";
import {
    appointmentCancelledMessage,
    appointmentConfirmationMessage,
    notifyInBackground,
    recipientFor,
    sendEmail,
} from "../../../notifications";
import { offerFreedSlotInBackground } from "../../../notifications/waitlist";

const isBusinessOwner = (req: AuthenticatedRequest, businessId: string): boolean => {
    const uid = req.user?.uid;
    if (!uid) return false;
    const business = (cacheManager.get("businessesMap", new Map()) as Map<string, Business>).get(businessId);
    return !!business && business.ownerId === uid;
};

const businessPolicy = (businessId: string) => (cacheManager.get("businessesMap", new Map()) as Map<string, Business>).get(businessId)?.policy;

export const SCreateAppointment: RouterService = async (req, res, next) => {
    try {
        const { businessId, userId, serviceId, staffId, start, end, source, notes, type } = req.body as CreateAppointmentModel;

        let assignedStaffId: string | undefined;
        const service = type === "APPOINTMENT" ? getServiceById(serviceId) : null;
        if (type === "APPOINTMENT") {
            // getServiceById searches every business's services, so without these two checks a
            // booking at business A could name business B's service — the event would store a
            // foreign serviceId and analytics would price it from the wrong catalogue. The
            // public listing already hides inactive services; this closes the same door for a
            // caller who supplies the id directly.
            if (!service) {
                res.status(404).json(jsonFailed("Service not found"));
                return;
            }
            if (service.businessId !== businessId) {
                res.status(422).json(jsonFailed("Service does not belong to this business"));
                return;
            }
            if (service.active === false) {
                res.status(422).json(jsonFailed("Service is not available for booking"));
                return;
            }
            if (durationMismatch(start, end, service.durationMin)) {
                res.status(422).json(jsonFailed("Appointment length must match the service duration"));
                return;
            }
            if (start < Date.now()) {
                res.status(422).json(jsonFailed("Cannot book a time in the past"));
                return;
            }

            // Blocking a customer had no effect on booking at all: the flag was written and
            // never read, so a barred customer kept booking normally. The business may still
            // book on their behalf — barring is about self-service, not about the business.
            const customer = (cacheManager.get("usersMap", new Map()) as Map<string, User>).get(userId);
            const isBlocked = !!customer && "blockedByBusinessIds" in customer && (customer.blockedByBusinessIds ?? []).includes(businessId);
            if (isBlocked && !isBusinessOwner(req as AuthenticatedRequest, businessId)) {
                res.status(403).json(jsonFailed("This business is not accepting bookings from your account"));
                return;
            }

            const business = (cacheManager.get("businessesMap", new Map()) as Map<string, Business>).get(businessId);
            if (!business) {
                res.status(404).json(jsonFailed("Business not found"));
                return;
            }
            // A business with staff is several resources, not one, so "is this time free" has no
            // answer until a person is named — and the business-wide check below would read one
            // colleague's booking as a closure for everybody. Where there is no staff the
            // business stays the single resource it has always been.
            const staffPool = eligibleStaffForService(businessId, serviceId);
            if (staffPool.length > 0) {
                const assigned = findFreeStaff(business, serviceId, parseTs(start), parseTs(end), staffId);
                if (!assigned) {
                    res.status(409).json(jsonFailed(staffId ? "That team member is not available then" : "Nobody is available at that time"));
                    return;
                }
                assignedStaffId = assigned.id;
            } else {
                if (staffId) {
                    res.status(422).json(jsonFailed("That team member cannot perform this service"));
                    return;
                }
                if (!isWithinBusinessHours(business, scheduleForService(business, service), parseTs(start), parseTs(end))) {
                    res.status(422).json(jsonFailed("That time is outside the business's opening hours"));
                    return;
                }
            }
        }

        const startTs = parseTs(start);
        const endTs = parseTs(end);

        // The transaction returns a result rather than answering the request itself: a
        // transaction callback can be retried, and responding inside it sent the headers twice
        // on every overlap (ERR_HTTP_HEADERS_SENT).
        const created = await db.runTransaction(async (tx) => {
            const overlap = await findOverlappingEvent(tx, businessId, startTs, endTs, undefined, assignedStaffId);
            if (overlap) return null;

            const newRef = db.collection("calendar").doc();
            const eventDoc: CalendarEvent = {
                id: newRef.id,
                businessId,
                userId,
                serviceId: service ? service.id : "",
                ...(assignedStaffId ? { staffId: assignedStaffId } : {}),
                type,
                status: "BOOKED",
                title: service?.name || type || "Event",
                start: startTs,
                end: endTs,
                source: source || "web",
                notes: notes || "",
                created: firebaseTimestamp(),
                timestamp: firebaseTimestamp(),
            };
            tx.set(newRef, eventDoc);
            return eventDoc;
        });

        if (!created) {
            res.status(409).json(jsonFailed("Slot already booked"));
            return;
        }

        cacheCalendarEvent({ ...created, id: created.id! });

        const business = (cacheManager.get("businessesMap", new Map()) as Map<string, Business>).get(businessId);
        const to = recipientFor((cacheManager.get("usersMap", new Map()) as Map<string, User>).get(userId));
        if (business && to) {
            const { subject, body } = appointmentConfirmationMessage(created, business, service ?? undefined);
            notifyInBackground(() => sendEmail({ to, subject, body, businessId, templateKey: "appointment_confirmation" }));
        }

        res.json(jsonOK({ calendarEventId: created.id }));
    } catch (error: any) {
        next(error);
    }
};

export const SConfirmAppointment: RouterService = async (req, res, next) => {
    try {
        const { calendarEventId } = req.body as { calendarEventId: string };
        const calendarRef = db.collection("calendar").doc(calendarEventId);
        await db.runTransaction(async (tx) => {
            const snap = await tx.get(calendarRef);
            if (!snap.exists) throw notFound("Appointment not found");
            const data = snap.data() as CalendarEvent;
            // Confirming used to reject only CANCELLED, so a DONE or NO_SHOW appointment could
            // be reset to CONFIRMED — rewriting history and pulling it back into counts it had
            // already left.
            if (data.status !== "BOOKED") throw new AppError(`Cannot confirm an appointment that is ${data.status}`);
            tx.update(calendarRef, { status: "CONFIRMED", timestamp: firebaseTimestamp() });
        });
        cacheCalendarEvent({ id: calendarEventId, status: "CONFIRMED" });
        res.json(jsonOK({ calendarEventId }));
    } catch (error) {
        next(error);
    }
};

export const SCancelAppointment: RouterService = async (req, res, next) => {
    try {
        const { calendarEventId, reason } = req.body as { calendarEventId: string; reason?: string };
        const calendarRef = db.collection("calendar").doc(calendarEventId);
        let alreadyCancelled = false;

        await db.runTransaction(async (tx) => {
            const snap = await tx.get(calendarRef);
            if (!snap.exists) throw notFound("Appointment not found");
            const data = snap.data() as CalendarEvent;

            if (data.status === "CANCELLED") {
                alreadyCancelled = true;
                return;
            }
            // A finished appointment is history. Flipping it to CANCELLED used to be allowed,
            // and silently removed its revenue from the business's reports.
            if (data.status === "DONE" || data.status === "NO_SHOW") {
                throw new AppError(`Cannot cancel an appointment that is ${data.status}`);
            }

            // Business.policy.cancellationWindowMin was collected in Edit Details and read by
            // nothing, so a customer could cancel a minute before the appointment. The business
            // is not bound by the window it sets for its customers.
            const windowMin = businessPolicy(data.businessId)?.cancellationWindowMin ?? 0;
            if (windowMin > 0 && !isBusinessOwner(req as AuthenticatedRequest, data.businessId)) {
                const minutesUntilStart = (data.start.toMillis() - Date.now()) / 60000;
                if (minutesUntilStart < windowMin) {
                    throw conflict(`Cancellations must be made at least ${windowMin} minutes in advance`);
                }
            }

            const updateData: Record<string, unknown> = { status: "CANCELLED", timestamp: firebaseTimestamp() };
            // The reason used to be written over `notes`, destroying whatever the customer
            // wrote when they booked.
            if (reason) updateData.cancelReason = reason;
            tx.update(calendarRef, updateData);
        });

        if (!alreadyCancelled) {
            cacheCalendarEvent({ id: calendarEventId, status: "CANCELLED" });
            const event = (cacheManager.get("calendarMap", new Map()) as Map<string, CalendarEvent>).get(calendarEventId);
            const business = event ? (cacheManager.get("businessesMap", new Map()) as Map<string, Business>).get(event.businessId) : undefined;
            const to = event ? recipientFor((cacheManager.get("usersMap", new Map()) as Map<string, User>).get(event.userId)) : undefined;
            if (event && business && to) {
                const service = event.serviceId ? getServiceById(event.serviceId) : undefined;
                const { subject, body } = appointmentCancelledMessage(event, business, service ?? undefined);
                notifyInBackground(() => sendEmail({ to, subject, body, businessId: event.businessId, templateKey: "appointment_cancelled" }));
            }
            // A cancellation is the only moment a slot becomes free, so it is where the waiting
            // list stops being storage and starts being a feature.
            if (event) offerFreedSlotInBackground(event);
        }
        res.json(jsonOK({ calendarEventId }));
    } catch (error) {
        next(error);
    }
};

export const SRescheduleAppointment: RouterService = async (req, res, next) => {
    try {
        const { calendarEventId, start, end, notes } = req.body as RescheduleAppointmentModel;
        const startTs = parseTs(start);
        const endTs = parseTs(end);
        const calendarRef = db.collection("calendar").doc(calendarEventId);

        const moved = await db.runTransaction(async (tx) => {
            const snap = await tx.get(calendarRef);
            if (!snap.exists) throw notFound("Appointment not found");
            const data = snap.data() as CalendarEvent;

            if (data.status === "CANCELLED") throw new AppError("Cannot reschedule a cancelled appointment");
            if (data.status === "DONE") throw new AppError("Cannot reschedule a completed appointment");
            // Moving a NO_SHOW into the future used to keep the NO_SHOW status, producing an
            // appointment that has not happened yet and is already marked missed.
            if (data.status === "NO_SHOW") throw new AppError("Cannot reschedule a missed appointment");

            if (data.type === "APPOINTMENT") {
                const service = getServiceById(data.serviceId);
                if (service && durationMismatch(start, end, service.durationMin)) {
                    throw new AppError("Appointment length must match the service duration");
                }
                if (start < Date.now()) throw new AppError("Cannot move an appointment into the past");

                const business = (cacheManager.get("businessesMap", new Map()) as Map<string, Business>).get(data.businessId);
                if (business && !isWithinBusinessHours(business, scheduleForService(business, service), startTs, endTs)) {
                    throw new AppError("That time is outside the business's opening hours");
                }
            }

            const overlap = await findOverlappingEvent(tx, data.businessId, startTs, endTs, calendarEventId);
            if (overlap) return null;

            const updateData: Record<string, unknown> = { start: startTs, end: endTs, timestamp: firebaseTimestamp() };
            if (notes !== undefined) updateData.notes = notes;
            // A customer moving a confirmed appointment must not carry the business's approval
            // over to a time the business never agreed to.
            const resetToBooked = data.status === "CONFIRMED" && !isBusinessOwner(req as AuthenticatedRequest, data.businessId);
            if (resetToBooked) updateData.status = "BOOKED";

            tx.update(calendarRef, updateData);
            return { start: startTs, end: endTs, status: resetToBooked ? ("BOOKED" as CalendarEvent["status"]) : data.status };
        });

        if (!moved) {
            res.status(409).json(jsonFailed("Slot already booked"));
            return;
        }

        cacheCalendarEvent({ id: calendarEventId, ...moved });
        res.json(jsonOK({ calendarEventId }));
    } catch (error) {
        next(error);
    }
};

export const SUpdateAppointmentStatus: RouterService = async (req, res, next) => {
    try {
        const { calendarEventId, status, notes } = req.body as UpdateAppointmentStatusModel;
        const calendarRef = db.collection("calendar").doc(calendarEventId);
        let marked: CalendarEvent | undefined;

        await db.runTransaction(async (tx) => {
            const snap = await tx.get(calendarRef);
            if (!snap.exists) throw notFound("Appointment not found");
            const data = snap.data() as CalendarEvent;

            if (data.status === "CANCELLED") throw new AppError("Cannot update status of a cancelled appointment");
            // DONE and NO_SHOW are statements about something that already happened. They used
            // to be settable on next week's booking, and on vacation blocks.
            if (data.type !== "APPOINTMENT") throw new AppError("Only appointments have an attendance status");
            if (data.start.toMillis() > Date.now()) throw new AppError("Cannot mark an appointment that has not started yet");

            const updateData: Record<string, unknown> = { status, timestamp: firebaseTimestamp() };
            if (notes !== undefined) updateData.notes = notes;
            tx.update(calendarRef, updateData);
            marked = data;
        });

        cacheCalendarEvent({ id: calendarEventId, status });

        // Business.policy.noShowAutoBlock and noShowLimit were collected in Edit Details and read
        // by nothing. Counting here, on the one transition that creates a no-show, keeps the
        // rule where the event is rather than in a job that has to scan for it.
        let autoBlocked = false;
        if (marked && status === "NO_SHOW") {
            const policy = businessPolicy(marked.businessId);
            const limit = policy?.noShowLimit ?? 0;
            if (policy?.noShowAutoBlock && limit > 0) {
                const history = cacheManager.get("calendar", []) as CalendarEvent[];
                const noShows = history.filter(
                    (e) => e.businessId === marked!.businessId && e.userId === marked!.userId && (e.status === "NO_SHOW" || e.id === calendarEventId),
                ).length;
                if (noShows >= limit) {
                    await db
                        .collection("users")
                        .doc(marked.userId)
                        .update({ blockedByBusinessIds: FieldValue.arrayUnion(marked.businessId), timestamp: firebaseTimestamp() })
                        .catch((error) => logger.error("auto-block failed", error));
                    logAudit({
                        businessId: marked.businessId,
                        userId: marked.userId,
                        entity: "customers",
                        action: "block",
                        subEntity: marked.userId,
                    });
                    autoBlocked = true;
                }
            }
        }

        res.json(jsonOK({ calendarEventId, status, autoBlocked }));
    } catch (error) {
        next(error);
    }
};
