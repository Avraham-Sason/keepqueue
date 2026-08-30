import express, { type Router } from "express";
import { SCreateStaff, SUpdateStaff, SDeleteStaff } from "./services";
import { authGuard, businessIdFrom, requireBusinessOwnership, validateBody } from "../../../middlewares";
import { createStaffSchema, updateStaffSchema, deleteStaffSchema } from "./schemes";

const staffRouter: Router = express.Router();

staffRouter.post("/create", authGuard("business"), validateBody(createStaffSchema), requireBusinessOwnership(), SCreateStaff);
staffRouter.post("/update", authGuard("business"), validateBody(updateStaffSchema), requireBusinessOwnership(businessIdFrom.staff), SUpdateStaff);
staffRouter.post("/delete", authGuard("business"), validateBody(deleteStaffSchema), requireBusinessOwnership(businessIdFrom.staff), SDeleteStaff);

export { staffRouter };
