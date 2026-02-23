"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignFieldExec = assignFieldExec;
exports.getAllFieldRequests = getAllFieldRequests;
exports.getFieldRequestById = getFieldRequestById;
exports.getAllFieldVerifications = getAllFieldVerifications;
exports.getFieldVerificationById = getFieldVerificationById;
const leadState_service_1 = require("../services/leadState.service");
const service = new leadState_service_1.LeadStateService();
/**
 * FIELD MANAGER assigns Field Exec to a Field Request
 */
async function assignFieldExec(req, res) {
    const { fieldRequestId, fieldExecId } = req.body;
    await service.assignFieldExec(fieldRequestId, fieldExecId, req.user.id);
    res.status(200).json({
        message: "Field executive assigned",
    });
}
/**
 * Get all Field Requests
 */
async function getAllFieldRequests(req, res) {
    const fieldRequests = await service.getAllFieldRequests();
    res.status(200).json({ fieldRequests });
}
/**
 * Get Field Request by ID
 */
async function getFieldRequestById(req, res) {
    const { id } = req.params;
    const fieldRequest = await service.getFieldRequestById(id);
    res.status(200).json({ fieldRequest });
}
/**
 * Get all Field Verifications
 */
async function getAllFieldVerifications(req, res) {
    const verifications = await service.getAllFieldVerifications();
    res.status(200).json({ verifications });
}
/**
 * Get Field Verification by ID
 */
async function getFieldVerificationById(req, res) {
    const { id } = req.params;
    const verification = await service.getFieldVerificationById(id);
    res.status(200).json({ verification });
}
