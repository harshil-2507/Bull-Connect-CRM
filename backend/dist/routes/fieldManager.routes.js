"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const roleGuard_1 = require("../middlewares/roleGuard");
const fieldManager_controller_1 = require("../controllers/fieldManager.controller");
const router = (0, express_1.Router)();
/**
 * FIELD MANAGER only routes
 */
router.use((0, roleGuard_1.roleGuard)(["FIELD_MANAGER"]));
// Field Requests
router.get("/field-requests", fieldManager_controller_1.getAllFieldRequests);
router.get("/field-requests/:id", fieldManager_controller_1.getFieldRequestById);
// Field Verifications
router.get("/field-verifications", fieldManager_controller_1.getAllFieldVerifications);
router.get("/field-verifications/:id", fieldManager_controller_1.getFieldVerificationById);
// Assign Field Exec
router.post("/assign-field-exec", fieldManager_controller_1.assignFieldExec);
exports.default = router;
