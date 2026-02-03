import { Request, Response } from "express";
import { LeadStateService } from "../services/leadState.service";

const service = new LeadStateService();

export async function markInterested(req: Request, res: Response) {
  const { leadId, notes } = req.body;
  const telecallerId = req.user.id;

  await service.markInterested(leadId, telecallerId, notes);

  res.json({ success: true });
}