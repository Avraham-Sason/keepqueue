import express, { type Router } from "express";
import { SAdminCreateBusiness, SAdminCreateUser, SAdminOverview, SAdminSetBusinessActive } from "./services";
import { authGuard, validateBody } from "../../middlewares";
import { rateLimiter } from "../../middlewares/rateLimiter";
import { createBusinessSchema, createUserSchema, setBusinessActiveSchema } from "./schemes";

const adminRouter: Router = express.Router();

// Every route here creates or flips real records; the global 100/min ceiling is far too
// loose for that, and an admin never needs more than a handful of writes a minute.
const adminWriteLimit = rateLimiter(60 * 1000, 20);

adminRouter.post("/overview", authGuard("admin"), SAdminOverview);
adminRouter.post("/users/create", authGuard("admin"), adminWriteLimit, validateBody(createUserSchema), SAdminCreateUser);
adminRouter.post("/businesses/create", authGuard("admin"), adminWriteLimit, validateBody(createBusinessSchema), SAdminCreateBusiness);
adminRouter.post("/businesses/setActive", authGuard("admin"), adminWriteLimit, validateBody(setBusinessActiveSchema), SAdminSetBusinessActive);

export { adminRouter };
