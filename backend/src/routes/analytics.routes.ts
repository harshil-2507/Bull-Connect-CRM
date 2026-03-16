import express from "express"

import {
  getLeadFunnel,
  getLeadStatusDistribution,
  getLeadTrend
} from "../controllers/analytics.controller"

const router = express.Router()

router.get("/lead-funnel", getLeadFunnel)

router.get("/lead-status", getLeadStatusDistribution)

router.get("/lead-trend", getLeadTrend)

export default router