import express, { type Router } from "express";
import { SCancelAppointment, SConfirmAppointment, SCreateAppointment, SRescheduleAppointment, SUpdateAppointmentStatus } from "./services";
import { validateBody } from "../../../middlewares";
import { cancelAppointmentSchema, confirmAppointmentSchema, createAppointmentSchema, rescheduleAppointmentSchema, updateAppointmentStatusSchema } from "./schemes";

const appointmentsRouter: Router = express.Router();

// Appointments
appointmentsRouter.post("/create", validateBody(createAppointmentSchema), SCreateAppointment);
appointmentsRouter.post("/cancel", validateBody(cancelAppointmentSchema), SCancelAppointment);
appointmentsRouter.post("/confirm", validateBody(confirmAppointmentSchema), SConfirmAppointment);
appointmentsRouter.post("/reschedule", validateBody(rescheduleAppointmentSchema), SRescheduleAppointment);
appointmentsRouter.post("/updateStatus", validateBody(updateAppointmentStatusSchema), SUpdateAppointmentStatus);

export { appointmentsRouter };
