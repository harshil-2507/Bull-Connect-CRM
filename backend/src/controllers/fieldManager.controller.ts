import { Request, Response } from "express";
import { FieldManagerService } from "../services/fieldManager.service";

const service = new FieldManagerService();

// ============================================================
// MAP
// ============================================================
export async function getMapData(req: Request, res: Response) {
  try {
    const data = await service.getMapData();
    res.json({ data });
  } catch (error) {
    console.error("MAP ERROR:", error);
    res.status(500).json({ error: "Failed to fetch map data" });
  }
}

// ============================================================
// TALUKA DETAILS
// ============================================================
export async function getTalukaDetails(req: Request, res: Response) {
  try {
    const { taluka } = req.params;

    if (!taluka) {
      return res.status(400).json({ error: "Taluka is required" });
    }

    const data = await service.getTalukaDetails(taluka);
    res.json(data);

  } catch (error) {
    console.error("TALUKA ERROR:", error);
    res.status(500).json({ error: "Failed to fetch taluka details" });
  }
}

// ============================================================
// SMART ASSIGN (🔥)
// ============================================================
export async function smartAssign(req: Request, res: Response) {
  try {
    const { taluka } = req.body;

    if (!taluka) {
      return res.status(400).json({ error: "Taluka is required" });
    }

    const result = await service.smartAssign(taluka, req.user.id);

    res.json({
      message: "Smart assignment completed",
      totalAssigned: result.length,
      result
    });

  } catch (error) {
    console.error("SMART ASSIGN ERROR:", error);
    res.status(500).json({ error: "Smart assignment failed" });
  }
}

// ============================================================
// BULK ASSIGN
// ============================================================
export async function bulkAssign(req: Request, res: Response) {
  try {
    const { assignments } = req.body;

    if (!assignments || !Array.isArray(assignments)) {
      return res.status(400).json({ error: "Invalid assignments" });
    }

    await service.bulkAssign(assignments, req.user.id);

    res.json({
      message: "Bulk assignment successful",
      count: assignments.length
    });

  } catch (error) {
    console.error("BULK ASSIGN ERROR:", error);
    res.status(500).json({ error: "Bulk assignment failed" });
  }
}

// ============================================================
// TEAM STATUS (WITH ETA)
// ============================================================
export async function getTeamStatus(req: Request, res: Response) {
  try {
    const data = await service.getTeamStatus();
    res.json({ data });

  } catch (error) {
    console.error("TEAM STATUS ERROR:", error);
    res.status(500).json({ error: "Failed to fetch team status" });
  }
}

// ============================================================
// SUGGESTION ENGINE
// ============================================================
export async function getSuggestions(req: Request, res: Response) {
  try {
    const { taluka } = req.params;

    if (!taluka) {
      return res.status(400).json({ error: "Taluka required" });
    }

    const data = await service.getAssignmentSuggestions(taluka);

    res.json(data);

  } catch (error) {
    console.error("SUGGESTION ERROR:", error);
    res.status(500).json({ error: "Failed to generate suggestions" });
  }
}

// ============================================================
//  COMPLETED VISITS 
// ============================================================
export async function getCompletedVisits(req: Request, res: Response) {
  try {
    const data = await service.getCompletedVisitsToday();

    res.json({
      count: data.length,
      data
    });

  } catch (error) {
    console.error("COMPLETED VISITS ERROR:", error);
    res.status(500).json({ error: "Failed to fetch completed visits" });
  }
}

// ============================================================
//  REASSIGN VISIT 
// ============================================================
export async function reassignVisit(req: Request, res: Response) {
  try {
    const { requestId, newExecId } = req.body;

    if (!requestId || !newExecId) {
      return res.status(400).json({
        error: "requestId and newExecId are required"
      });
    }

    await service.reassignVisit(requestId, newExecId, req.user.id);

    res.json({
      message: "Visit reassigned successfully"
    });

  } catch (error) {
    console.error("REASSIGN ERROR:", error);
    res.status(500).json({ error: "Failed to reassign visit" });
  }
}