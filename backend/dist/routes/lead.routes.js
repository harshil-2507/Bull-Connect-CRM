"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lead_controller_1 = require("../controllers/lead.controller");
const router = (0, express_1.Router)();
router.post("/", lead_controller_1.createLead);
router.get("/", lead_controller_1.getAllLeads);
router.get("/:id", lead_controller_1.getLeadById);
exports.default = router;
