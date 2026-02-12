import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import { getNextLead, logCall } from "../controllers/telecaller.controller";

const router = Router();

/**
 * TELECALLER only routes
 */
router.use(roleGuard(["TELECALLER"]));

router.get("/next", getNextLead);

router.post("/call", logCall);

export default router;