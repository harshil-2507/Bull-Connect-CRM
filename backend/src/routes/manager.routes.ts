import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import { assignToTelecaller } from "../controllers/manager.controller";

const router = Router();

/**
 * MANAGER only routes
 */
router.use(roleGuard(["MANAGER"]));

router.post("/assign-telecaller", assignToTelecaller);

export default router;