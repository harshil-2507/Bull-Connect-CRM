import { Request, Response } from "express";
import { LeadService } from "../services/lead.service";
import { LeadStateService } from "../services/leadState.service";

const leadService = new LeadService();
const leadStateService = new LeadStateService();

/**
 * CREATE LEAD
 */
export const createLead = async (req: Request, res: Response) => {
  try {
    const {
      farmer_name,
      phone_number,
      alternate_phone,
      farmer_id,

      village,
      taluka,
      district,
      state,

      farmer_type,
      bull_centre,

      source,
      product_type,

      crop_type,
      acreage,

      total_land_bigha,
      interested_in_warehouse,
      previous_experience,

      experience_or_remarks,

      castor_bori,
      castor_expected_price,
      castor_intent_to_sell,

      groundnut_bori,
      groundnut_expected_price
    } = req.body;

    if (!farmer_name || !phone_number) {
      return res.status(400).json({
        error: "farmer_name and phone_number are required",
      });
    }

    const lead = await leadService.createLead({
      farmer_name,
      phone_number,
      alternate_phone,
      farmer_id,

      village,
      taluka,
      district,
      state,

      farmer_type,
      bull_centre,

      source,
      product_type,

      crop_type,
      acreage,

      total_land_bigha,
      interested_in_warehouse,
      previous_experience,

      experience_or_remarks,

      castor_bori,
      castor_expected_price,
      castor_intent_to_sell,

      groundnut_bori,
      groundnut_expected_price
    });

    res.status(201).json(lead);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * UPDATE LEAD (Non-state fields only)
 */
export const updateLead = async (req: Request, res: Response) => {
  try {
    const lead = await leadService.updateLead(req.params.id, req.body);
    res.status(200).json(lead);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * GET ALL LEADS
 */
export const getAllLeads = async (req: Request, res: Response) => {
  try {

    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 20

    const data = await leadService.getAllLeads(page, limit)

    res.status(200).json(data)

  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

/**
 * GET LEAD BY ID
 */
export const getLeadById = async (req: Request, res: Response) => {
  try {
    const lead = await leadService.getLeadById(req.params.id);
    res.status(200).json(lead);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
};

/**
 * LOG CALL (State Machine Driven)
 */
export const logCall = async (req: Request, res: Response) => {
  try {
    const { disposition, notes } = req.body;

    if (!disposition) {
      return res.status(400).json({
        error: "disposition is required",
      });
    }

    //  Real authenticated user 
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized - user not found in request",
      });
    }

    await leadStateService.call(
      req.params.id,
      userId,
      disposition,
      notes || null
    );

    res.status(200).json({
      success: true,
      message: "Call logged successfully",
    });

  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};


/**
 * GET LEAD ACTIVITIES
 */
export const getLeadActivities = async (req: Request, res: Response) => {

  try {

    const activities = await leadService.getLeadActivities(req.params.id)

    res.status(200).json(activities)

  } catch (err: any) {

    res.status(400).json({
      error: err.message
    })

  }

};


export const moveLeadsToCampaign = async (req: Request, res: Response) => {

  try {

    const { campaignId, leadIds } = req.body

    if (!campaignId || !Array.isArray(leadIds)) {
      return res.status(400).json({
        error: "campaignId and leadIds required"
      })
    }

    const result = await leadService.moveLeadsToCampaign(
      campaignId,
      leadIds
    )

    res.status(200).json(result)

  } catch (err:any) {

    res.status(400).json({ error: err.message })

  }

};