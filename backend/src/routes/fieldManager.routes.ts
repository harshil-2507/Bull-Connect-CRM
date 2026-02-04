import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import { assignFieldExec } from "../controllers/fieldManager.controller";

const router = Router();

/**
 * FIELD MANAGER only routes
 */
router.use(roleGuard(["FIELD_MANAGER"]));

router.post("/assign-field-exec", assignFieldExec);

export default router;