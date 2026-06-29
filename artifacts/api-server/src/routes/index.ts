import { Router, type IRouter } from "express";
import healthRouter from "./health";
import conversationsRouter from "./conversations";
import messagesRouter from "./messages";
import settingsRouter from "./settings";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/conversations", conversationsRouter);
router.use("/messages", messagesRouter);
router.use("/settings", settingsRouter);
router.use("/admin", adminRouter);

export default router;
