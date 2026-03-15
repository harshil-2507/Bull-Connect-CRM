import { Router } from "express";
import { auth } from "../middlewares/auth";
import { 
  createLead, 
  getAllLeads, 
  getLeadById, 
  updateLead,
  logCall,
  getLeadActivities,
  moveLeadsToCampaign
} from "../controllers/lead.controller";

const router = Router();

router.post("/", auth, createLead);
router.get("/", auth, getAllLeads);
router.get("/:id", auth, getLeadById);
router.get("/:id/activities", auth, getLeadActivities);
router.put("/:id", auth, updateLead);
router.post("/:id/call", auth, logCall);
router.patch("/move-to-campaign", moveLeadsToCampaign)

export default router;