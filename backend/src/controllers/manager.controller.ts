import { Request, Response } from "express";
import { LeadStateService } from "../services/leadState.service";

const service = new LeadStateService();

/**
 * BULK ASSIGN
 */
export async function assignLeadsBulk(req: Request, res: Response) {
  const { assignments } = req.body;

  const result = await service.assignLeadsBulk(
    assignments,
    req.user.id
  );

  res.status(200).json({
    message: "Leads assigned successfully",
    ...result
  });
}

/**
 * SINGLE (existing)
 */
export async function assignToTelecaller(req: Request, res: Response) {
  const { leadId, telecallerId } = req.body;

  await service.assignTelecaller(leadId, telecallerId, req.user.id);

  res.status(200).json({
    message: "Lead assigned to telecaller",
  });
}

export async function getAllTelecallers(req: Request, res: Response) {
  const data = await service.getAllTelecallers();
  res.status(200).json(data);
}

export async function getAllTeleAssignments(req: Request, res: Response) {
  const data = await service.getAllTeleAssignments();
  res.status(200).json(data);
}

export async function getTeleAssignmentById(req: Request, res: Response) {
  const { id } = req.params;
  const data = await service.getTeleAssignmentById(id);
  res.status(200).json(data);
}

/**
 * NEW API
 */
export async function getUnassignedLeads(req: Request, res: Response) {
  const { campaignId } = req.params;
  const data = await service.getUnassignedLeads(campaignId);
  res.status(200).json(data);
}