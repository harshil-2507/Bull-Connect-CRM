"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roleGuard_1 = require("../middlewares/roleGuard");
const fieldExec_controller_1 = require("../controllers/fieldExec.controller");
const router = (0, express_1.Router)();
/**
 * FIELD EXEC only routes
 */
router.use((0, roleGuard_1.roleGuard)(["FIELD_EXEC"]));
// Field Exec Verifications
router.post("/verify", fieldExec_controller_1.verifyLead);
// Field Exec Assignments
router.get("/assignments", fieldExec_controller_1.getAllAssignments);
router.get("/assignments/:id", fieldExec_controller_1.getAssignmentById);
exports.default = router;
