import { Request, Response } from "express";
import { performance } from "perf_hooks";
import { CampaignService } from "../services/campaign.service";
import { AssignmentService } from "../services/bulkAssignment.service";


const service = new CampaignService();
const assignmentService = new AssignmentService();

export const createCampaign = async (req: Request, res: Response) => {
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
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getAllCampaigns = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const isActiveQuery = req.query.is_active;

    const isActive =
      isActiveQuery === undefined
        ? undefined
        : isActiveQuery === "true";

    const result = await service.getAllCampaigns({
      page,
      limit,
      isActive,
    });

    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getCampaignById = async (req: Request, res: Response) => {
  try {
    const campaign = await service.getCampaignById(req.params.id);
    res.status(200).json(campaign);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
};

export const toggleCampaign = async (req: Request, res: Response) => {
  try {
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return res.status(400).json({ error: "is_active must be boolean" });
    }

    const campaign = await service.toggleCampaign(
      req.params.id,
      is_active
    );

    res.status(200).json(campaign);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getCampaignLeads = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await service.getLeadsByCampaign(req.params.id, {
      page,
      limit,
    });

    res.status(200).json(result);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
};

export const getAllCampaignStats = async (_req: Request, res: Response) => {
  try {
    const stats = await service.getAllCampaignStats();
    res.status(200).json(stats);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getCampaignStatsById = async (req: Request, res: Response) => {
  try {
    const stats = await service.getCampaignStatsById(req.params.id);
    res.status(200).json(stats);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
};

export const getCampaignPipeline = async (req: Request, res: Response) => {
  try {
    const result = await service.getCampaignPipeline(req.params.id);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
};

export const uploadCampaignCsv = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "CSV file is required" });
    }

    const campaignId = req.params.id;

    const start = performance.now();

    const result = await service.uploadCsvToCampaign(
      campaignId,
      req.file.buffer
    );

    const end = performance.now();

    res.status(200).json({
      ...result,
      durationMs: Math.round(end - start),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const bulkAssignCampaignLeads = async (req: Request, res: Response) => {
  try {
    const { telecallerId, leadIds, limit } = req.body;

    if (!telecallerId) {
      return res.status(400).json({
        error: "telecallerId is required",
      });
    }

    const result = await assignmentService.bulkAssignToTelecaller(
      req.params.id,
      Number(telecallerId),
      { leadIds, limit }
    );

    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};