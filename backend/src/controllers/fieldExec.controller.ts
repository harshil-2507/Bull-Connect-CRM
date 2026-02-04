import { Request, Response } from "express";
import { LeadStateService } from "../services/leadState.service";

const service = new LeadStateService();

/**
 * FIELD EXEC verifies the lead on ground
 */
export async function verifyLead(
  req: Request,
  res: Response
) {
  const { leadId, finalStatus, photoRef } = req.body;

  await service.verify(
    leadId,
    req.user.id,
    finalStatus,
    photoRef
  );

  res.status(200).json({
    message: "Lead verification completed",
  });
}