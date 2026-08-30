import express, { type Router } from "express";
import { SCreateService, SUpdateService, SDeleteService } from "./services";
import { validateBody } from "../../../middlewares";
import { createServiceSchema, updateServiceSchema, deleteServiceSchema } from "./schemes";

const servicesRouter: Router = express.Router();

servicesRouter.post("/create", validateBody(createServiceSchema), SCreateService);
servicesRouter.post("/update", validateBody(updateServiceSchema), SUpdateService);
servicesRouter.post("/delete", validateBody(deleteServiceSchema), SDeleteService);

export { servicesRouter };
