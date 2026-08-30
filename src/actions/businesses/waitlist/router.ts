import express, { type Router } from "express";
import { SAddToWaitlist, SDeleteFromWaitlist } from "./services";
import { validateBody } from "../../../middlewares";
import { addToWaitlistSchema, deleteFromWaitlistSchema } from "./schemes";

const waitlistRouter: Router = express.Router();

waitlistRouter.post("/add", validateBody(addToWaitlistSchema), SAddToWaitlist);
waitlistRouter.post("/delete", validateBody(deleteFromWaitlistSchema), SDeleteFromWaitlist);

export { waitlistRouter };
