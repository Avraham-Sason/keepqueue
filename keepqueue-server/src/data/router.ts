import express, { type Router } from "express";
import {
    S_getBusiness, S_getMyAppointments, S_getAvailabilityByServiceId, S_getBusinessCustomers,
    S_getUserById, S_getBusinessStaff, S_getBusinessWaitlist, S_getBusinessReviews,
    S_getBusinessRatings, S_getBusinessAppointments, S_getBusinessAnalytics, S_searchBusinesses,
} from "./services";
import {
    getBusinessSchema, getMyAppointmentsSchema, getAvailabilityByServiceIdSchema,
    getBusinessCustomersSchema, getUserByIdSchema, getBusinessStaffSchema,
    getBusinessWaitlistSchema, getBusinessReviewsSchema, getBusinessRatingsSchema,
    getBusinessAppointmentsSchema, getBusinessAnalyticsSchema, searchBusinessesSchema,
} from "./schemes";
import { attachUserIfPresent, authGuard, requireBusinessOwnership, validateBody } from "../middlewares";

const dataRouter: Router = express.Router();

dataRouter.get("/", (req, res) => res.send("OK from data"));

dataRouter.post("/getMyAppointments", authGuard(), validateBody(getMyAppointmentsSchema), S_getMyAppointments);

dataRouter.post("/searchBusinesses", validateBody(searchBusinessesSchema), S_searchBusinesses);

dataRouter.post("/getBusiness", attachUserIfPresent(), validateBody(getBusinessSchema), S_getBusiness);

dataRouter.post("/getAvailabilityByServiceId", validateBody(getAvailabilityByServiceIdSchema), S_getAvailabilityByServiceId);

dataRouter.post("/getBusinessCustomers", authGuard("business"), validateBody(getBusinessCustomersSchema), requireBusinessOwnership(), S_getBusinessCustomers);

dataRouter.post("/getUserById", authGuard(), validateBody(getUserByIdSchema), S_getUserById);

dataRouter.post("/getBusinessStaff", authGuard("business"), validateBody(getBusinessStaffSchema), requireBusinessOwnership(), S_getBusinessStaff);

dataRouter.post("/getBusinessWaitlist", authGuard("business"), validateBody(getBusinessWaitlistSchema), requireBusinessOwnership(), S_getBusinessWaitlist);

dataRouter.post("/getBusinessReviews", validateBody(getBusinessReviewsSchema), S_getBusinessReviews);

dataRouter.post("/getBusinessRatings", validateBody(getBusinessRatingsSchema), S_getBusinessRatings);

dataRouter.post("/getBusinessAppointments", authGuard("business"), validateBody(getBusinessAppointmentsSchema), requireBusinessOwnership(), S_getBusinessAppointments);

dataRouter.post("/getBusinessAnalytics", authGuard("business"), validateBody(getBusinessAnalyticsSchema), requireBusinessOwnership(), S_getBusinessAnalytics);

export { dataRouter };
