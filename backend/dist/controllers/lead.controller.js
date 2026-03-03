"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logCall = exports.getLeadById = exports.getAllLeads = exports.updateLead = exports.createLead = void 0;
const lead_service_1 = require("../services/lead.service");
const leadState_service_1 = require("../services/leadState.service");
const leadService = new lead_service_1.LeadService();
const leadStateService = new leadState_service_1.LeadStateService();
/**
 * CREATE LEAD
 */
const createLead = async (req, res) => {
    try {
        const { farmer_name, phone_number, village, taluka, district, state, farmer_type, bull_centre, crop_type, acreage, total_land_bigha, interested_in_warehouse, previous_experience } = req.body;
        if (!farmer_name || !phone_number) {
            return res.status(400).json({
                error: "farmer_name and phone_number are required",
            });
        }
        const lead = await leadService.createLead({
            farmer_name,
            phone_number,
            village,
            taluka,
            district,
            state,
            farmer_type,
            bull_centre,
            crop_type,
            acreage,
            total_land_bigha,
            interested_in_warehouse,
            previous_experience
        });
        res.status(201).json(lead);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.createLead = createLead;
/**
 * UPDATE LEAD (Non-state fields only)
 */
const updateLead = async (req, res) => {
    try {
        const lead = await leadService.updateLead(req.params.id, req.body);
        res.status(200).json(lead);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.updateLead = updateLead;
/**
 * GET ALL LEADS
 */
const getAllLeads = async (_req, res) => {
    try {
        const leads = await leadService.getAllLeads();
        res.status(200).json(leads);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.getAllLeads = getAllLeads;
/**
 * GET LEAD BY ID
 */
const getLeadById = async (req, res) => {
    try {
        const lead = await leadService.getLeadById(req.params.id);
        res.status(200).json(lead);
    }
    catch (err) {
        res.status(404).json({ error: err.message });
    }
};
exports.getLeadById = getLeadById;
/**
 * LOG CALL (State Machine Driven)
 */
const logCall = async (req, res) => {
    try {
        const { disposition, notes } = req.body;
        if (!disposition) {
            return res.status(400).json({
                error: "disposition is required",
            });
        }
        //  Real authenticated user 
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized - user not found in request",
            });
        }
        await leadStateService.call(req.params.id, userId, disposition, notes || null);
        res.status(200).json({
            success: true,
            message: "Call logged successfully",
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.logCall = logCall;
