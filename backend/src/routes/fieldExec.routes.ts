import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import { verifyLead } from "../controllers/fieldExec.controller";

const router = Router();

/**
 * FIELD EXEC only routes
 */
router.use(roleGuard(["FIELD_EXEC"]));

router.post("/verify", verifyLead);

export default router;