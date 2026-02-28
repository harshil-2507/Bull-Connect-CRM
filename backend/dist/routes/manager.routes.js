"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roleGuard_1 = require("../middlewares/roleGuard");
const manager_controller_1 = require("../controllers/manager.controller");
const router = (0, express_1.Router)();
/**
 * MANAGER only routes
 */
router.use((0, roleGuard_1.roleGuard)(["MANAGER"]));
// test
router.get("/telecallers", manager_controller_1.getAllTelecallers);
router.post("/assign-telecaller", manager_controller_1.assignToTelecaller);
router.get("/tele-assignments", manager_controller_1.getAllTeleAssignments);
router.get("/tele-assignments/:id", manager_controller_1.getTeleAssignmentById);
exports.default = router;
