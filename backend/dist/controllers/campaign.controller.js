"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkAssignCampaignLeads = exports.uploadCampaignCsv = exports.getCampaignPipeline = exports.getCampaignStatsById = exports.getAllCampaignStats = exports.getCampaignLeads = exports.toggleCampaign = exports.getCampaignById = exports.getAllCampaigns = exports.createCampaign = void 0;
const perf_hooks_1 = require("perf_hooks");
const campaign_service_1 = require("../services/campaign.service");
const bulkAssignment_service_1 = require("../services/bulkAssignment.service");
const service = new campaign_service_1.CampaignService();
const assignmentService = new bulkAssignment_service_1.AssignmentService();
const createCampaign = async (req, res) => {
    try {
        const { name, description, start_date, end_date } = req.body;
        if (!name) {
            return res.status(400).json({ error: "Campaign name is required" });
        }
        const campaign = await service.createCampaign({
            name,
            description,
            start_date,
            end_date,
            created_by: req.user.id,
        });
        res.status(201).json(campaign);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.createCampaign = createCampaign;
const getAllCampaigns = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const isActiveQuery = req.query.is_active;
        const isActive = isActiveQuery === undefined
            ? undefined
            : isActiveQuery === "true";
        const result = await service.getAllCampaigns({
            page,
            limit,
            isActive,
        });
        res.status(200).json(result);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.getAllCampaigns = getAllCampaigns;
const getCampaignById = async (req, res) => {
    try {
        const campaign = await service.getCampaignById(req.params.id);
        res.status(200).json(campaign);
    }
    catch (err) {
        res.status(404).json({ error: err.message });
    }
};
exports.getCampaignById = getCampaignById;
const toggleCampaign = async (req, res) => {
    try {
        const { is_active } = req.body;
        if (typeof is_active !== "boolean") {
            return res.status(400).json({ error: "is_active must be boolean" });
        }
        const campaign = await service.toggleCampaign(req.params.id, is_active);
        res.status(200).json(campaign);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.toggleCampaign = toggleCampaign;
const getCampaignLeads = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const result = await service.getLeadsByCampaign(req.params.id, {
            page,
            limit,
        });
        res.status(200).json(result);
    }
    catch (err) {
        res.status(404).json({ error: err.message });
    }
};
exports.getCampaignLeads = getCampaignLeads;
const getAllCampaignStats = async (_req, res) => {
    try {
        const stats = await service.getAllCampaignStats();
        res.status(200).json(stats);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.getAllCampaignStats = getAllCampaignStats;
const getCampaignStatsById = async (req, res) => {
    try {
        const stats = await service.getCampaignStatsById(req.params.id);
        res.status(200).json(stats);
    }
    catch (err) {
        res.status(404).json({ error: err.message });
    }
};
exports.getCampaignStatsById = getCampaignStatsById;
const getCampaignPipeline = async (req, res) => {
    try {
        const result = await service.getCampaignPipeline(req.params.id);
        res.status(200).json(result);
    }
    catch (err) {
        res.status(404).json({ error: err.message });
    }
};
exports.getCampaignPipeline = getCampaignPipeline;
const uploadCampaignCsv = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "CSV file is required" });
        }
        const campaignId = req.params.id;
        const start = perf_hooks_1.performance.now();
        const result = await service.uploadCsvToCampaign(campaignId, req.file.buffer);
        const end = perf_hooks_1.performance.now();
        res.status(200).json({
            ...result,
            durationMs: Math.round(end - start),
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.uploadCampaignCsv = uploadCampaignCsv;
const bulkAssignCampaignLeads = async (req, res) => {
    try {
        const { telecallerId, leadIds, limit } = req.body;
        if (!telecallerId) {
            return res.status(400).json({
                error: "telecallerId is required",
            });
        }
        const result = await assignmentService.bulkAssignToTelecaller(req.params.id, Number(telecallerId), { leadIds, limit });
        res.status(200).json(result);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.bulkAssignCampaignLeads = bulkAssignCampaignLeads;
