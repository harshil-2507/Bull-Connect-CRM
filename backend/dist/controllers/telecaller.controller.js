"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logCall = logCall;
exports.getNextLead = getNextLead;
exports.getWorkQueue = getWorkQueue;
const telecaller_service_1 = require("../services/telecaller.service");
const callLog_service_1 = require("../services/callLog.service");
const leadState_service_1 = require("../services/leadState.service");
const telecallerService = new telecaller_service_1.TelecallerService();
const service = new leadState_service_1.LeadStateService();
/**
 * TELECALLER logs a call outcome
 */
async function logCall(req, res) {
    const { leadId, disposition, notes, nextCallbackAt, durationSeconds, cropType, acreage, dropReason, dropNotes, } = req.body;
    try {
        // No early required-dropReason check here; service will fill a sensible default.
        const callInput = {
            leadId,
            userId: req.user.id,
            disposition,
            notes,
            nextCallbackAt: nextCallbackAt ? new Date(nextCallbackAt) : undefined,
            durationSeconds,
            cropType,
            acreage,
            dropReason
        };
        const result = await (0, callLog_service_1.recordCallLog)(callInput);
        res.status(200).json({
            message: "Call logged successfully",
            callLogId: result.callLogId,
            newStatus: result.newStatus,
            attemptCount: result.attemptCount,
        });
    }
    catch (err) {
        console.error('Error in telecaller.logCall:', err);
        const msg = err.message || '';
        // treat expected validation or ownership errors as 400
        if (msg.includes('Invalid') ||
            msg.includes('required') ||
            msg.includes('Lead is not assigned') ||
            msg.includes('Lead cannot be called')) {
            return res.status(400).json({ error: msg });
        }
        // otherwise it's unexpected
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
/**
 * TELECALLER fetches the next lead assigned to them
 */
async function getNextLead(req, res) {
    try {
        const lead = await service.getNextLeadForTelecaller(req.user.id);
        if (!lead) {
            return res.status(200).json({ message: "No leads available" });
        }
        res.status(200).json({ lead });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
//work queue for telecaller - list of all leads assigned to them, with current status and last disposition
//phase 1 -> strict queue(no ai or priority sorting) - leads are returned in order of assignment, but telecaller can choose any lead from the queue
async function getWorkQueue(req, res) {
    try {
        const telecallerId = req.user.id;
        const queue = await telecallerService.getWorkQueue(telecallerId);
        res.status(200).json({
            total: queue.length,
            data: queue,
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
