import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import { logCall } from "../controllers/telecaller.controller";

const router = Router();

/**
 * TELECALLER only routes
 */
router.use(roleGuard(["TELECALLER"]));

router.post("/call", logCall);

export default router;