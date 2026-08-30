import express, { type Router } from "express";
import {
    S_getBusiness, S_getCollection, S_getAvailabilityByServiceId, S_getBusinessCustomers,
    S_getUserById, S_getBusinessStaff, S_getBusinessWaitlist, S_getBusinessReviews,
    S_getBusinessRatings, S_getBusinessAppointments, S_getBusinessAnalytics,
} from "./services";
import {
    getBusinessSchema, getCollectionSchema, getAvailabilityByServiceIdSchema,
    getBusinessCustomersSchema, getUserByIdSchema, getBusinessStaffSchema,
    getBusinessWaitlistSchema, getBusinessReviewsSchema, getBusinessRatingsSchema,
    getBusinessAppointmentsSchema, getBusinessAnalyticsSchema,
} from "./schemes";
import { validateBody } from "../middlewares";

const dataRouter: Router = express.Router();

dataRouter.get("/", (req, res) => res.send("OK from data"));

dataRouter.post("/getCollection", validateBody(getCollectionSchema), S_getCollection);

dataRouter.post("/getBusiness", validateBody(getBusinessSchema), S_getBusiness);

dataRouter.post("/getAvailabilityByServiceId", validateBody(getAvailabilityByServiceIdSchema), S_getAvailabilityByServiceId);

dataRouter.post("/getBusinessCustomers", validateBody(getBusinessCustomersSchema), S_getBusinessCustomers);

dataRouter.post("/getUserById", validateBody(getUserByIdSchema), S_getUserById);

dataRouter.post("/getBusinessStaff", validateBody(getBusinessStaffSchema), S_getBusinessStaff);

dataRouter.post("/getBusinessWaitlist", validateBody(getBusinessWaitlistSchema), S_getBusinessWaitlist);

dataRouter.post("/getBusinessReviews", validateBody(getBusinessReviewsSchema), S_getBusinessReviews);

dataRouter.post("/getBusinessRatings", validateBody(getBusinessRatingsSchema), S_getBusinessRatings);

dataRouter.post("/getBusinessAppointments", validateBody(getBusinessAppointmentsSchema), S_getBusinessAppointments);

dataRouter.post("/getBusinessAnalytics", validateBody(getBusinessAnalyticsSchema), S_getBusinessAnalytics);

export { dataRouter };
