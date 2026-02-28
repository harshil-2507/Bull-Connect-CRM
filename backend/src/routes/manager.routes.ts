import { Router } from "express";
import { roleGuard } from "../middlewares/roleGuard";
import { assignToTelecaller, getAllTeleAssignments, getTeleAssignmentById, getAllTelecallers } from "../controllers/manager.controller";

const router = Router();

/**
 * MANAGER only routes
 */
router.use(roleGuard(["MANAGER"]));

// test
router.get("/telecallers", getAllTelecallers);

router.post("/assign-telecaller", assignToTelecaller);

router.get("/tele-assignments", getAllTeleAssignments);
router.get("/tele-assignments/:id", getTeleAssignmentById);


export default router;