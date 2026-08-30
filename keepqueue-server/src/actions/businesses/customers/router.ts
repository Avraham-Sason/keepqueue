import express, { type Router } from "express";
import { SBlockCustomer, SUnblockCustomer, SUpdateCustomer } from "./services";
import { authGuard, requireBusinessOwnership, validateBody } from "../../../middlewares";
import { blockCustomerSchema, unblockCustomerSchema, updateCustomerSchema } from "./schemes";

const customersRouter: Router = express.Router();

customersRouter.post("/block", authGuard("business"), validateBody(blockCustomerSchema), requireBusinessOwnership(), SBlockCustomer);
customersRouter.post("/unblock", authGuard("business"), validateBody(unblockCustomerSchema), requireBusinessOwnership(), SUnblockCustomer);
customersRouter.post("/update", authGuard("business"), validateBody(updateCustomerSchema), requireBusinessOwnership(), SUpdateCustomer);

export { customersRouter };
