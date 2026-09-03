import express, { type Router } from "express";
import { SAddToWaitlist, SDeleteFromWaitlist } from "./services";
import { authGuard, requireRecordAccess, requireSelfOrBusinessOwner, validateBody, createLimiter } from "../../../middlewares";
import { addToWaitlistSchema, deleteFromWaitlistSchema } from "./schemes";

const waitlistRouter: Router = express.Router();

waitlistRouter.post("/add", authGuard(), createLimiter(), validateBody(addToWaitlistSchema), requireSelfOrBusinessOwner(), SAddToWaitlist);
waitlistRouter.post("/delete", authGuard(), validateBody(deleteFromWaitlistSchema), requireRecordAccess("waitlist", "waitItemId"), SDeleteFromWaitlist);

export { waitlistRouter };
