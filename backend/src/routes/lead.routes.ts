import { Router } from "express";
import { createLead, getAllLeads, getLeadById, updateLead } from "../controllers/lead.controller";

const router = Router();

router.post("/", createLead);
router.get("/", getAllLeads);
router.get("/:id", getLeadById);
router.put("/:id", updateLead);

export default router;
