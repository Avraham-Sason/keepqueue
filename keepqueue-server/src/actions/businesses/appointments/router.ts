import express, { type Router } from "express";
import { SCancelAppointment, SConfirmAppointment, SCreateAppointment, SRescheduleAppointment, SUpdateAppointmentStatus } from "./services";
import { authGuard, businessIdFrom, requireBusinessOwnership, requireRecordAccess, requireSelfOrBusinessOwner, validateBody } from "../../../middlewares";
import { cancelAppointmentSchema, confirmAppointmentSchema, createAppointmentSchema, rescheduleAppointmentSchema, updateAppointmentStatusSchema } from "./schemes";

const appointmentsRouter: Router = express.Router();

// Appointments
appointmentsRouter.post("/create", authGuard(), validateBody(createAppointmentSchema), requireSelfOrBusinessOwner(), SCreateAppointment);
appointmentsRouter.post("/cancel", authGuard(), validateBody(cancelAppointmentSchema), requireRecordAccess("calendar", "calendarEventId"), SCancelAppointment);
appointmentsRouter.post("/confirm", authGuard("business"), validateBody(confirmAppointmentSchema), requireBusinessOwnership(businessIdFrom.calendarEvent), SConfirmAppointment);
appointmentsRouter.post("/reschedule", authGuard(), validateBody(rescheduleAppointmentSchema), requireRecordAccess("calendar", "calendarEventId"), SRescheduleAppointment);
appointmentsRouter.post("/updateStatus", authGuard("business"), validateBody(updateAppointmentStatusSchema), requireBusinessOwnership(businessIdFrom.calendarEvent), SUpdateAppointmentStatus);

export { appointmentsRouter };
