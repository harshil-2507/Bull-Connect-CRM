import { Request, Response } from "express";
import { CampaignService } from "../services/campaign.service";

const service = new CampaignService();

/**
 * Create Campaign
 */
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
      created_by: Number(req.user.id),
    });

    res.status(201).json(campaign);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * Get All Campaigns (Pagination + Filtering)
 * Example:
 * GET /campaigns?page=1&limit=10&is_active=true
 */
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

/**
 * Get Campaign By ID
 */
export const getCampaignById = async (req: Request, res: Response) => {
  try {
    const campaign = await service.getCampaignById(req.params.id);
    res.status(200).json(campaign);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
};

/**
 * Toggle Campaign Active Status
 */
export const toggleCampaign = async (req: Request, res: Response) => {
  try {
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return res
        .status(400)
        .json({ error: "is_active must be boolean" });
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

/**
 * Get Leads Under Campaign
 * GET /campaigns/:id/leads
 */
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