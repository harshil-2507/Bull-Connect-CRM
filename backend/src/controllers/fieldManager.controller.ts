import { Request, Response } from "express";
import { LeadStateService } from "../services/leadState.service";

const service = new LeadStateService();

/**
 * FIELD MANAGER assigns Field Exec to a Field Request
 */
export async function assignFieldExec(
  req: Request,
  res: Response
) {
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