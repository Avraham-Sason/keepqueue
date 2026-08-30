import express, { type Router } from "express";
import { SCreateService, SUpdateService, SDeleteService } from "./services";
import { authGuard, businessIdFrom, requireBusinessOwnership, validateBody } from "../../../middlewares";
import { createServiceSchema, updateServiceSchema, deleteServiceSchema } from "./schemes";

const servicesRouter: Router = express.Router();

servicesRouter.post("/create", authGuard("business"), validateBody(createServiceSchema), requireBusinessOwnership(), SCreateService);
servicesRouter.post("/update", authGuard("business"), validateBody(updateServiceSchema), requireBusinessOwnership(businessIdFrom.service), SUpdateService);
servicesRouter.post("/delete", authGuard("business"), validateBody(deleteServiceSchema), requireBusinessOwnership(businessIdFrom.service), SDeleteService);

export { servicesRouter };
