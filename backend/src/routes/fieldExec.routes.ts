import { Router } from "express";
import { verifyLead } from "../controllers/fieldExec.controller";

const router = Router();

router.post("/verify", verifyLead);

export default router;