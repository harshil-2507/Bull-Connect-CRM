import { Request, Response } from "express";
import { LeadStateService } from "../services/leadState.service";

const service = new LeadStateService();

/**
 * FIELD EXEC verifies the lead on ground
 */
export async function verifyLead(req: Request, res: Response) {
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

/**
 * Get all assignments for the logged-in Field Exec
 */
export async function getAllAssignments(req: Request, res: Response) {
  const assignments = await service.getAssignmentsForExec(req.user.id);
  res.status(200).json({ assignments });
}

/**
 * Get assignment by ID for the logged-in Field Exec
 */
export async function getAssignmentById(req: Request, res: Response) {
  const { id } = req.params;
  const assignment = await service.getAssignmentByIdForExec(id, req.user.id);
  res.status(200).json({ assignment });
}
