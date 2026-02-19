import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  toggleCampaign,
} from "../controllers/campaign.controller";

const router = Router();

/**
 * ADMIN + MANAGER allowed
 */
router.use(roleGuard(["ADMIN", "MANAGER"]));

router.post("/", createCampaign);
router.get("/", getAllCampaigns);
router.get("/:id", getCampaignById);
router.patch("/:id/toggle", toggleCampaign);

export default router;