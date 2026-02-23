"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyLead = verifyLead;
exports.getAllAssignments = getAllAssignments;
exports.getAssignmentById = getAssignmentById;
const leadState_service_1 = require("../services/leadState.service");
const service = new leadState_service_1.LeadStateService();
/**
 * FIELD EXEC verifies the lead on ground
 */
async function verifyLead(req, res) {
    const { leadId, finalStatus, photoRef } = req.body;
    await service.verify(leadId, req.user.id, finalStatus, photoRef);
    res.status(200).json({
        message: "Lead verification completed",
    });
}
/**
 * Get all assignments for the logged-in Field Exec
 */
async function getAllAssignments(req, res) {
    const assignments = await service.getAssignmentsForExec(req.user.id);
    res.status(200).json({ assignments });
}
/**
 * Get assignment by ID for the logged-in Field Exec
 */
async function getAssignmentById(req, res) {
    const { id } = req.params;
    const assignment = await service.getAssignmentByIdForExec(id, req.user.id);
    res.status(200).json({ assignment });
}
