import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  createCampaign,
  getAllCampaigns,
  
  getCampaignById,
  toggleCampaign,
} from "../controllers/campaign.controller";
import { getCampaignLeads } from "../controllers/campaign.controller";
import { getAllCampaignStats, getCampaignStatsById } from "../controllers/campaign.controller";
import { getCampaignPipeline } from "../controllers/campaign.controller";

const router = Router();

/**
 * ADMIN + MANAGER allowed
 */
router.use(roleGuard(["ADMIN", "MANAGER"]));

router.post("/", createCampaign);

router.get("/", getAllCampaigns);

router.get("/stats", getAllCampaignStats);

router.get("/:id/pipeline", getCampaignPipeline);

router.get("/:id/stats", getCampaignStatsById);

router.get("/:id/leads", getCampaignLeads);
router.get("/:id", getCampaignById);
router.patch("/:id/toggle", toggleCampaign);
export default router;