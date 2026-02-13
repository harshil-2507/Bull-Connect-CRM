import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import { 
  assignFieldExec,
  getAllFieldRequests,
  getFieldRequestById,
  getAllFieldVerifications,
  getFieldVerificationById
} from "../controllers/fieldManager.controller";

const router = Router();

/**
 * FIELD MANAGER only routes
 */
router.use(roleGuard(["FIELD_MANAGER"]));

// Field Requests
router.get("/field-requests", getAllFieldRequests);
router.get("/field-requests/:id", getFieldRequestById);

// Field Verifications
router.get("/field-verifications", getAllFieldVerifications);
router.get("/field-verifications/:id", getFieldVerificationById);

// Assign Field Exec
router.post("/assign-field-exec", assignFieldExec);

export default router;
