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

  await service.assignTelecaller(leadId, telecallerId, req.user.id);

  res.status(200).json({
    message: "Lead assigned to telecaller",
  });
}

/**
 * MANAGER: Get all telecaller assignments
 */
export async function getAllTeleAssignments(req: Request, res: Response) {
  const assignments = await service.getAllTeleAssignments();
  res.status(200).json(assignments);
}

/**
 * MANAGER: Get telecaller assignment by ID
 */
export async function getTeleAssignmentById(req: Request, res: Response) {
  const { id } = req.params;
  const assignment = await service.getTeleAssignmentById(id);
  res.status(200).json(assignment);
}
