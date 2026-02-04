import { Request, Response } from "express";
import { LeadStateService } from "../services/leadState.service";

const service = new LeadStateService();

/**
 * MANAGER assigns a lead to a telecaller
 * Initial transition: UNASSIGNED → TELE_PROSPECTING
 */
export async function assignToTelecaller(
  req: Request,
  res: Response
) {
  const { leadId, telecallerId } = req.body;

  await service.assignTelecaller(leadId, telecallerId);

  res.status(200).json({
    message: "Lead assigned to telecaller",
  });
}