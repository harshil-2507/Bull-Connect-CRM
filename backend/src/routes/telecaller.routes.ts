import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import {
  getNextLead,
  logCall,
  getWorkQueue,
  getMyStats,
  getLeaderboard
} from "../controllers/telecaller.controller";

const router = Router();

router.use(roleGuard(["TELECALLER"]));

router.get("/next", getNextLead);
router.get("/queue", getWorkQueue);
router.get("/stats", getMyStats);
router.get("/leaderboard", getLeaderboard);

router.post("/call", logCall);

export default router;