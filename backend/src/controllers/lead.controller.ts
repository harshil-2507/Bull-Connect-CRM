import { Request, Response } from "express";
import { LeadService } from "../services/lead.service";

const service = new LeadService();

export const createLead = async (req: Request, res: Response) => {
  try {
    const { name, phone, taluka, district, geo_state } = req.body;

    // ALWAYS enforce lead_status = "UNASSIGNED"
    const lead = await service.createLead({
      name,
      phone,
      taluka,
      district,
      geo_state,
      lead_status: "UNASSIGNED", // server-side enforced
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
