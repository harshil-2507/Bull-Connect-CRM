import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  getDashboardSummary,
  getPipelineAnalytics,
  getTelecallerPerformance,
  getVisitAnalytics,
  getCropAnalytics,
} from "../controllers/adminDashboard.controller";

const router = Router();

/**
 * All routes below are ADMIN only
 */
router.use(roleGuard(["ADMIN"]));

/**
 * =====================================
 * GET Dashboard Summary (Top KPIs)
 * =====================================
 * Query Params:
 * ?from=YYYY-MM-DD
 * ?to=YYYY-MM-DD
 */
router.get("/summary", getDashboardSummary);

/**
 * =====================================
 * GET Pipeline Distribution
 * =====================================
 * Query Params:
 * ?from=YYYY-MM-DD
 * ?to=YYYY-MM-DD
 */
router.get("/pipeline", getPipelineAnalytics);

/**
 * =====================================
 * GET Telecaller Performance
 * =====================================
 * Query Params:
 * ?from=YYYY-MM-DD
 * ?to=YYYY-MM-DD
 * ?page=1
 * ?limit=10
 */
router.get(
  "/telecaller-performance",
  getTelecallerPerformance
);

/**
 * =====================================
 * GET Visit Analytics
 * =====================================
 * Query Params:
 * ?from=YYYY-MM-DD
 * ?to=YYYY-MM-DD
 */
router.get("/visit-analytics", getVisitAnalytics);

/**
 * =====================================
 * GET Crop Analytics
 * =====================================
 * Query Params:
 * ?from=YYYY-MM-DD
 * ?to=YYYY-MM-DD
 */
router.get("/crop-analytics", getCropAnalytics);

export default router;