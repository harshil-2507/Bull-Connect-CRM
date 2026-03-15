import { Router } from "express";
import multer from "multer";
import { roleGuard } from "../middlewares/roleGuard";

import {
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  // toggleCampaign,
  updateCampaignStatus,
  getCampaignLeads,
  getAllCampaignStats,
  getCampaignStatsById,
  getCampaignPipeline,
  uploadCampaignCsv,
  bulkAssignCampaignLeads
} from "../controllers/campaign.controller";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 1024
  }
});

router.use(roleGuard(["ADMIN", "MANAGER"]));

router.post("/", createCampaign);
router.get("/", getAllCampaigns);

router.get("/stats", getAllCampaignStats);

router.get("/:id/pipeline", getCampaignPipeline);
router.get("/:id/stats", getCampaignStatsById);

router.get("/:id/leads", getCampaignLeads);
router.get("/:id", getCampaignById);

// router.patch("/:id/toggle", toggleCampaign);
router.patch("/:id/status", updateCampaignStatus);

router.post("/:id/upload", upload.single("file"), uploadCampaignCsv);

router.post("/:id/assign", bulkAssignCampaignLeads);

export default router;