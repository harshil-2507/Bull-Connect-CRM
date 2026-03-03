import { Request, Response } from "express";
import { AdminDashboardService } from "../services/adminDashboard.service";

const service = new AdminDashboardService();

/**
 * ===============================
 * Dashboard Summary (Top KPI Cards)
 * ===============================
 */
export const getDashboardSummary = async (
  req: Request,
  res: Response
) => {
  try {
    const { from, to } = req.query;

    const data = await service.getSummary({
      from: from as string | undefined,
      to: to as string | undefined,
    });

    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch dashboard summary",
      error: error.message,
    });
  }
};

/**
 * ===============================
 * Pipeline Analytics
 * ===============================
 */
export const getPipelineAnalytics = async (
  req: Request,
  res: Response
) => {
  try {
    const { from, to } = req.query;

    const data = await service.getPipeline({
      from: from as string | undefined,
      to: to as string | undefined,
    });

    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch pipeline analytics",
      error: error.message,
    });
  }
};

/**
 * ===============================
 * Telecaller Performance
 * ===============================
 */
export const getTelecallerPerformance = async (
  req: Request,
  res: Response
) => {
  try {
    const { from, to, page = "1", limit = "10" } = req.query;

    const data = await service.getTelecallerPerformance({
      from: from as string | undefined,
      to: to as string | undefined,
      page: Number(page),
      limit: Number(limit),
    });

    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch telecaller performance",
      error: error.message,
    });
  }
};

/**
 * ===============================
 * Visit Analytics
 * ===============================
 */
export const getVisitAnalytics = async (
  req: Request,
  res: Response
) => {
  try {
    const { from, to } = req.query;

    const data = await service.getVisitAnalytics({
      from: from as string | undefined,
      to: to as string | undefined,
    });

    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch visit analytics",
      error: error.message,
    });
  }
};

/**
 * ===============================
 * Crop Analytics
 * ===============================
 */
export const getCropAnalytics = async (
  req: Request,
  res: Response
) => {
  try {
    const { from, to } = req.query;

    const data = await service.getCropAnalytics({
      from: from as string | undefined,
      to: to as string | undefined,
    });

    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch crop analytics",
      error: error.message,
    });
  }
};