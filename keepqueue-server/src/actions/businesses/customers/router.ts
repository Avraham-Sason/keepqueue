import express, { type Router } from "express";
import { SBlockCustomer, SUnblockCustomer, SUpdateCustomer } from "./services";
import { validateBody } from "../../../middlewares";
import { blockCustomerSchema, unblockCustomerSchema, updateCustomerSchema } from "./schemes";

const customersRouter: Router = express.Router();

customersRouter.post("/block", validateBody(blockCustomerSchema), SBlockCustomer);
customersRouter.post("/unblock", validateBody(unblockCustomerSchema), SUnblockCustomer);
customersRouter.post("/update", validateBody(updateCustomerSchema), SUpdateCustomer);

export { customersRouter };
