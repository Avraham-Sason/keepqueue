import express, { Router } from "express";
import { MainRouter } from "./types";
import { dataRouter } from "./data";
import { actionsRouter } from "./actions";
const rootRouter: Router = express.Router();

rootRouter.get("/", (req, res) => res.status(200).send("OK from root"));

rootRouter.use("/actions", actionsRouter);
rootRouter.use("/data", dataRouter);

const mainRouter: MainRouter = (app) => {
    app.use(rootRouter);
};

export default mainRouter;
