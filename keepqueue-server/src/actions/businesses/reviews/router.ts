import express, { type Router } from "express";
import { SCreateReview, SModerateReview } from "./services";
import { validateBody } from "../../../middlewares";
import { createReviewSchema, moderateReviewSchema } from "./schemes";

const reviewsRouter: Router = express.Router();

reviewsRouter.post("/create", validateBody(createReviewSchema), SCreateReview);
reviewsRouter.post("/moderate", validateBody(moderateReviewSchema), SModerateReview);

export { reviewsRouter };
