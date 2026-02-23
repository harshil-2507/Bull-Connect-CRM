"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeadById = exports.getAllLeads = exports.createLead = void 0;
const lead_service_1 = require("../services/lead.service");
const service = new lead_service_1.LeadService();
const createLead = async (req, res) => {
    try {
        const { name, phone, taluka, district, geo_state, campaign_id } = req.body;
        if (!name || !phone || !campaign_id) {
            return res.status(400).json({
                error: "name, phone and campaign_id are required",
            });
        }
        // ALWAYS enforce lead_status = "UNASSIGNED"
        const lead = await service.createLead({
            name,
            phone,
            taluka,
            district,
            geo_state,
            campaign_id, // client can specify campaign_id, but lead_status is server-side enforced
            lead_status: "UNASSIGNED", // server-side enforced
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
