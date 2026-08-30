import express, { type Router } from "express";
import { SCreateReview, SModerateReview } from "./services";
import { authGuard, businessIdFrom, requireBusinessOwnership, requireSelfOrBusinessOwner, validateBody } from "../../../middlewares";
import { createReviewSchema, moderateReviewSchema } from "./schemes";

const reviewsRouter: Router = express.Router();

reviewsRouter.post("/create", authGuard(), validateBody(createReviewSchema), requireSelfOrBusinessOwner(), SCreateReview);
reviewsRouter.post("/moderate", authGuard("business"), validateBody(moderateReviewSchema), requireBusinessOwnership(businessIdFrom.review), SModerateReview);

export { reviewsRouter };
