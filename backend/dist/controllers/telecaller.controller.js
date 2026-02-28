"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logCall = logCall;
exports.getNextLead = getNextLead;
exports.getWorkQueue = getWorkQueue;
const leadState_service_1 = require("../services/leadState.service");
const telecaller_service_1 = require("../services/telecaller.service");
const service = new leadState_service_1.LeadStateService();
const telecallerService = new telecaller_service_1.TelecallerService();
/**
 * TELECALLER logs a call outcome
 */
async function logCall(req, res) {
    const { leadId, disposition, notes } = req.body;
    try {
        await service.call(leadId, req.user.id, disposition, notes ?? null);
        res.status(200).json({ message: "Call logged successfully" });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
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
