import { Request, Response } from "express";
import { LeadStateService } from "../services/leadState.service";

const service = new LeadStateService();

/**
 * TELECALLER logs a call outcome
 */
export async function logCall(
  req: Request,
  res: Response
) {
  const { leadId, disposition, notes } = req.body;

  await service.call(
    leadId,
    req.user.id,
    disposition,
    notes ?? null
  );

  res.status(200).json({
    message: "Call logged successfully",
  });
}