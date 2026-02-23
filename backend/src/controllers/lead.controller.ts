import { Request, Response } from "express";
import { LeadService } from "../services/lead.service";

const service = new LeadService();

export const createLead = async (req: Request, res: Response) => {
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
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getAllLeads = async (_req: Request, res: Response) => {
  try {
    const leads = await service.getAllLeads();
    res.status(200).json(leads);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getLeadById = async (req: Request, res: Response) => {
  try {
    const lead = await service.getLeadById(req.params.id);
    res.status(200).json(lead);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
};
