// src/controllers/telecaller.controller.ts
import { Request, Response } from "express";
import { LeadStateService } from "../services/leadState.service";
import { TelecallerService } from "../services/telecaller.service";

const service = new LeadStateService();
const telecallerService = new TelecallerService();


/**
 * TELECALLER logs a call outcome
 */
export async function logCall(req: Request, res: Response) {
  const { leadId, disposition, notes } = req.body;

  try {

    await service.call(
      leadId,
      req.user.id,
      disposition,
      notes ?? null,
    );

    res.status(200).json({ message: "Call logged successfully" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
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
    const queue = await telecallerService.getWorkQueue(
      Number(req.user.id)
    );

    res.status(200).json({
      total: queue.length,
      data: queue,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
