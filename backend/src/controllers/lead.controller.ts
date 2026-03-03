import { Request, Response } from "express";
import { LeadService } from "../services/lead.service";

const service = new LeadService();

export const createLead = async (req: Request, res: Response) => {
  try {
    const {
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
    } = req.body;

    if (!farmer_name || !phone_number) {
      return res.status(400).json({
        error: "farmer_name and phone_number are required",
      });
    }

    const lead = await service.createLead({
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