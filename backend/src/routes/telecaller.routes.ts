import { Router } from "express";
import { markInterested } from "../controllers/telecaller.controller";

const router = Router();

router.post("/interested", markInterested);

export default router;