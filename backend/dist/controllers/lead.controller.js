"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeadById = exports.getAllLeads = exports.createLead = void 0;
const lead_service_1 = require("../services/lead.service");
const service = new lead_service_1.LeadService();
const createLead = async (req, res) => {
    try {
        const { farmer_name, phone_number, village, taluka, district, state, campaign_id } = req.body;
        if (!farmer_name || !phone_number || !campaign_id) {
            return res.status(400).json({
                error: "farmer_name, phone_number and campaign_id are required",
            });
        }
        // ALWAYS enforce status = "NEW"
        const lead = await service.createLead({
            farmer_name,
            phone_number,
            village,
            taluka,
            district,
            state,
            campaign_id,
            status: "NEW", // server-side enforced
        });
        res.status(201).json(lead);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.createLead = createLead;
const getAllLeads = async (_req, res) => {
    try {
        const leads = await service.getAllLeads();
        res.status(200).json(leads);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.getAllLeads = getAllLeads;
const getLeadById = async (req, res) => {
    try {
        const lead = await service.getLeadById(req.params.id);
        res.status(200).json(lead);
    }
    catch (err) {
        res.status(404).json({ error: err.message });
    }
};
exports.getLeadById = getLeadById;
