import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";

import {
  assignToTelecaller,
  assignLeadsBulk,
  getAllTeleAssignments,
  getTeleAssignmentById,
  getAllTelecallers,
  getUnassignedLeads
} from "../controllers/manager.controller";

const router = Router();

router.use(roleGuard(["MANAGER"]));

router.get("/telecallers", getAllTelecallers);

// NEW
router.get("/campaigns/:campaignId/unassigned-leads", getUnassignedLeads);

// OLD
router.post("/assign-telecaller", assignToTelecaller);

router.post("/assign-leads-bulk", assignLeadsBulk);

router.get("/tele-assignments", getAllTeleAssignments);
router.get("/tele-assignments/:id", getTeleAssignmentById);

export default router;