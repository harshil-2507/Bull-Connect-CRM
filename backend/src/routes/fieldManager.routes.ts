import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  getMapData,
  getTalukaDetails,
  smartAssign,
  bulkAssign,
  getTeamStatus,
  getCompletedVisits,
  reassignVisit
} from "../controllers/fieldManager.controller";

const router = Router();

router.use(roleGuard(["FIELD_MANAGER"]));

// MAP
router.get("/map", getMapData);

// TALUKA
router.get("/taluka/:taluka", getTalukaDetails);

// SMART ASSIGN
router.post("/assign/smart", smartAssign);

// BULK ASSIGN
router.post("/assign/bulk", bulkAssign);

// TEAM STATUS
router.get("/team/status", getTeamStatus);

// COMPLETED VISITS
router.get("/visits/completed", getCompletedVisits);

// REASSIGN
router.post("/reassign", reassignVisit);

export default router;