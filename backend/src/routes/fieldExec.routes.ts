import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import { 
  verifyLead,
  getAllAssignments,
  getAssignmentById
} from "../controllers/fieldExec.controller";

const router = Router();

/**
 * FIELD EXEC only routes
 */
router.use(roleGuard(["FIELD_EXEC"]));

// Field Exec Verifications
router.post("/verify", verifyLead);

// Field Exec Assignments
router.get("/assignments", getAllAssignments);
router.get("/assignments/:id", getAssignmentById);

export default router;
