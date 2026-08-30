import express, { type Router } from "express";
import { appointmentsRouter } from "./appointments";
import { servicesRouter } from "./services/router";
import { staffRouter } from "./staff/router";
import { customersRouter } from "./customers/router";
import { waitlistRouter } from "./waitlist/router";
import { reviewsRouter } from "./reviews/router";
import { SUpdateBusiness } from "./services";
import { authGuard, requireBusinessOwnership, validateBody } from "../../middlewares";
import { updateBusinessSchema } from "./schemes";

const businessesRouter: Router = express.Router();

businessesRouter.use("/appointments", appointmentsRouter);
businessesRouter.use("/services", servicesRouter);
businessesRouter.use("/staff", staffRouter);
businessesRouter.use("/customers", customersRouter);
businessesRouter.use("/waitlist", waitlistRouter);
businessesRouter.use("/reviews", reviewsRouter);

businessesRouter.post("/update", authGuard("business"), validateBody(updateBusinessSchema), requireBusinessOwnership(), SUpdateBusiness);

export { businessesRouter };
