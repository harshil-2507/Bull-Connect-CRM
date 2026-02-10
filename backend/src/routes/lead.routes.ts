import { Router } from "express";
import { createLead, getAllLeads, getLeadById } from "../controllers/lead.controller";

const router = Router();

router.post("/", createLead);
router.get("/", getAllLeads);
router.get("/:id", getLeadById);

export default router;
