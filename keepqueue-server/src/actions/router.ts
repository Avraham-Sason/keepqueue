import express, { type Router } from "express";
import { businessesRouter } from "./businesses";
import { adminRouter } from "./admin";

const actionsRouter: Router = express.Router();

actionsRouter.get("/", (req, res) => res.send("OK from actions"));

actionsRouter.use("/admin", adminRouter);
actionsRouter.use("/businesses", businessesRouter);

export { actionsRouter };
