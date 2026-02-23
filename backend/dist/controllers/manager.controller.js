"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignToTelecaller = assignToTelecaller;
exports.getAllTeleAssignments = getAllTeleAssignments;
exports.getTeleAssignmentById = getTeleAssignmentById;
const leadState_service_1 = require("../services/leadState.service");
const service = new leadState_service_1.LeadStateService();
/**
 * MANAGER assigns a lead to a telecaller
 * Initial transition: UNASSIGNED → TELE_PROSPECTING
 */
async function assignToTelecaller(req, res) {
    const { leadId, telecallerId } = req.body;
    await service.assignTelecaller(leadId, telecallerId, req.user.id);
    res.status(200).json({
        message: "Lead assigned to telecaller",
    });
}
/**
 * MANAGER: Get all telecaller assignments
 */
async function getAllTeleAssignments(req, res) {
    const assignments = await service.getAllTeleAssignments();
    res.status(200).json(assignments);
}
/**
 * MANAGER: Get telecaller assignment by ID
 */
async function getTeleAssignmentById(req, res) {
    const { id } = req.params;
    const assignment = await service.getTeleAssignmentById(id);
    res.status(200).json(assignment);
}
