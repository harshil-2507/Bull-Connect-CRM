// src/controllers/telecaller.controller.ts

import { Request, Response } from "express";
import { TelecallerService } from "../services/telecaller.service";
import { recordCallOnly } from "../services/callLog.service";
import { LeadStateService } from "../services/leadState.service";

const telecallerService = new TelecallerService();
const leadStateService = new LeadStateService();

/**
 * TELECALLER logs call + updates state
 */
export async function logCall(req: Request, res: Response) {
  try {

    const {
      leadId,
      disposition,
      notes,
      durationSeconds,
      cropType,
      acreage,
      nextCallbackAt
    } = req.body;
    console.log("REQ BODY:", req.body);
    // Step 1: log call (fixed mapping inside service)
    await recordCallOnly({
      leadId,
      userId: req.user.id,
      disposition,
      notes,
      durationSeconds
    });

    // Step 2: update lead state
    let result;

    try {
      result = await leadStateService.handleTelecallerCall({
        leadId,
        userId: req.user.id,
        disposition,
        notes,
        cropType,
        acreage,
        nextCallbackAt: nextCallbackAt ? new Date(nextCallbackAt) : undefined
      });
    } catch (err) {
      console.error("STATE ERROR:", err);
      throw err; //  IMPORTANT: propagate error properly
    }



    return res.status(200).json({
      message: "Call processed successfully",
      newStatus: result.status
    });

  } catch (err: any) {
    console.error("logCall error:", err);
    res.status(400).json({ error: err.message });
  }
}

/**
 * NEXT LEAD
 */
export async function getNextLead(req: Request, res: Response) {
  try {
    const lead = await leadStateService.getNextLeadForTelecaller(req.user.id);

    if (!lead) {
      return res.status(200).json({ message: "No leads available" });
    }

    res.status(200).json({ lead });

  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * WORK QUEUE
 */
export async function getWorkQueue(req: Request, res: Response) {
  try {
    const queue = await telecallerService.getWorkQueue(req.user.id);

    res.status(200).json({
      total: queue.length,
      data: queue,
    });

  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * STATS
 */
export async function getMyStats(req: Request, res: Response) {
  try {
    const stats = await telecallerService.getMyStats(req.user.id);
    res.status(200).json(stats);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

/**
 * LEADERBOARD
 */
export async function getLeaderboard(req: Request, res: Response) {
  try {
    const data = await telecallerService.getLeaderboard();
    res.status(200).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}