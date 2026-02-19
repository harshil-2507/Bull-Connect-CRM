import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import { getNextLead, logCall } from "../controllers/telecaller.controller";
import { getWorkQueue } from "../controllers/telecaller.controller";

const router = Router();

/**
 * TELECALLER only routes
 */
router.use(roleGuard(["TELECALLER"]));

//order matters here - getNextLead should be before getWorkQueue, otherwise it will always return the whole queue instead of the next lead
router.get("/next", getNextLead);

router.get("/queue", getWorkQueue);

router.post("/call", logCall);

export default router;