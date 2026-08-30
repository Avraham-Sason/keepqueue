import express, { type Router } from "express";
import { SCreateStaff, SUpdateStaff, SDeleteStaff } from "./services";
import { validateBody } from "../../../middlewares";
import { createStaffSchema, updateStaffSchema, deleteStaffSchema } from "./schemes";

const staffRouter: Router = express.Router();

staffRouter.post("/create", validateBody(createStaffSchema), SCreateStaff);
staffRouter.post("/update", validateBody(updateStaffSchema), SUpdateStaff);
staffRouter.post("/delete", validateBody(deleteStaffSchema), SDeleteStaff);

export { staffRouter };
