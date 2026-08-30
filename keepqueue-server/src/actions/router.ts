import express, { type Router } from "express";
import { SLogin } from "./services";
import { businessesRouter } from "./businesses";

const actionsRouter: Router = express.Router();

actionsRouter.get("/", (req, res) => res.send("OK from actions"));

actionsRouter.post("/login", SLogin);

actionsRouter.use("/businesses", businessesRouter);

export { actionsRouter };
