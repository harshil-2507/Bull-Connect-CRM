// src/controllers/telecaller.controller.ts
import { Request, Response } from "express";
import { TelecallerService } from "../services/telecaller.service";
import { recordCallLog, CallLogInput } from "../services/callLog.service";
import { LeadStateService } from "../services/leadState.service";

const telecallerService = new TelecallerService();
const service = new LeadStateService();


/**
 * TELECALLER logs a call outcome
 */
export async function logCall(req: Request, res: Response) {
  const {
    leadId,
    disposition,
    notes,
    nextCallbackAt,
    durationSeconds,
    cropType,
    acreage,
    dropReason,
    dropNotes,
  } = req.body;

  try {
    // No early required-dropReason check here; service will fill a sensible default.

    const callInput: CallLogInput = {
      leadId,
      userId: req.user.id,
      disposition,
      notes,
      nextCallbackAt: nextCallbackAt ? new Date(nextCallbackAt) : undefined,
      durationSeconds,
      cropType,
      acreage,
      dropReason
    };

    const result = await recordCallLog(callInput);

    res.status(200).json({
      message: "Call logged successfully",
      callLogId: result.callLogId,
      newStatus: result.newStatus,
      attemptCount: result.attemptCount,
    });
  } catch (err: any) {
    console.error('Error in telecaller.logCall:', err);
    const msg = err.message || '';
    // treat expected validation or ownership errors as 400
    if (
      msg.includes('Invalid') ||
      msg.includes('required') ||
      msg.includes('Lead is not assigned') ||
      msg.includes('Lead cannot be called')
    ) {
      return res.status(400).json({ error: msg });
    }
    // otherwise it's unexpected
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


/**
 * TELECALLER fetches the next lead assigned to them
 */
export async function getNextLead(req: Request, res: Response) {
  try {
    const lead = await service.getNextLeadForTelecaller(req.user.id);

    if (!lead) {
      return res.status(200).json({ message: "No leads available" });
    }

    res.status(200).json({ lead });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

//work queue for telecaller - list of all leads assigned to them, with current status and last disposition
//phase 1 -> strict queue(no ai or priority sorting) - leads are returned in order of assignment, but telecaller can choose any lead from the queue
export async function getWorkQueue(req: Request, res: Response) {
  try {
    const telecallerId = req.user.id;
    const queue = await telecallerService.getWorkQueue(telecallerId);
    res.status(200).json({
      total: queue.length,
      data: queue,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
