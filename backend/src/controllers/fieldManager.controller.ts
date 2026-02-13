import { Request, Response } from "express";
import { LeadStateService } from "../services/leadState.service";

const service = new LeadStateService();

/**
 * FIELD MANAGER assigns Field Exec to a Field Request
 */
export async function assignFieldExec(req: Request, res: Response) {
  const { fieldRequestId, fieldExecId } = req.body;

  await service.assignFieldExec(
    fieldRequestId,
    fieldExecId,
    req.user.id
  );

  res.status(200).json({
    message: "Field executive assigned",
  });
}

/**
 * Get all Field Requests
 */
export async function getAllFieldRequests(req: Request, res: Response) {
  const fieldRequests = await service.getAllFieldRequests();
  res.status(200).json({ fieldRequests });
}

/**
 * Get Field Request by ID
 */
export async function getFieldRequestById(req: Request, res: Response) {
  const { id } = req.params;
  const fieldRequest = await service.getFieldRequestById(id);
  res.status(200).json({ fieldRequest });
}

/**
 * Get all Field Verifications
 */
export async function getAllFieldVerifications(req: Request, res: Response) {
  const verifications = await service.getAllFieldVerifications();
  res.status(200).json({ verifications });
}

/**
 * Get Field Verification by ID
 */
export async function getFieldVerificationById(req: Request, res: Response) {
  const { id } = req.params;
  const verification = await service.getFieldVerificationById(id);
  res.status(200).json({ verification });
}
