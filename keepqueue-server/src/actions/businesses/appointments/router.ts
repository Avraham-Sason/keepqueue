import express, { type Router } from "express";
import { SCancelAppointment, SConfirmAppointment, SCreateAppointment, SRescheduleAppointment, SUpdateAppointmentStatus } from "./services";
import { authGuard, businessIdFrom, createLimiter, requireBusinessOwnership, requireRecordAccess, requireOwnerForNonBookingEvent, requireSelfOrBusinessOwner, validateBody } from "../../../middlewares";
import { cancelAppointmentSchema, confirmAppointmentSchema, createAppointmentSchema, rescheduleAppointmentSchema, updateAppointmentStatusSchema } from "./schemes";

const appointmentsRouter: Router = express.Router();

// Appointments
appointmentsRouter.post("/create", authGuard(), createLimiter(), validateBody(createAppointmentSchema), requireSelfOrBusinessOwner(), requireOwnerForNonBookingEvent(), SCreateAppointment);
appointmentsRouter.post("/cancel", authGuard(), validateBody(cancelAppointmentSchema), requireRecordAccess("calendar", "calendarEventId"), SCancelAppointment);
appointmentsRouter.post("/confirm", authGuard("business"), validateBody(confirmAppointmentSchema), requireBusinessOwnership(businessIdFrom.calendarEvent), SConfirmAppointment);
appointmentsRouter.post("/reschedule", authGuard(), validateBody(rescheduleAppointmentSchema), requireRecordAccess("calendar", "calendarEventId"), SRescheduleAppointment);
appointmentsRouter.post("/updateStatus", authGuard("business"), validateBody(updateAppointmentStatusSchema), requireBusinessOwnership(businessIdFrom.calendarEvent), SUpdateAppointmentStatus);

export { appointmentsRouter };
