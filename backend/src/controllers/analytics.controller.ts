import { Request, Response } from "express"
import db from "../db/connectioon"

export const getLeadFunnel = async (
  req: Request,
  res: Response
) => {

  try {

    const result = await db.query(`
      SELECT status, COUNT(*) as count
      FROM leads
      GROUP BY status
      ORDER BY count DESC
    `)

    res.json({
      success: true,
      data: result.rows
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      success: false,
      message: "Failed to fetch lead funnel"
    })

  }

}

export const getLeadStatusDistribution = async (
  req: Request,
  res: Response
) => {

  try {

    const result = await db.query(`
      SELECT status, COUNT(*) as count
      FROM leads
      GROUP BY status
    `)

    res.json({
      success: true,
      data: result.rows
    })

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Failed to fetch lead status distribution"
    })

  }

}

export const getLeadTrend = async (
  req: Request,
  res: Response
) => {

  try {

    const result = await db.query(`
      SELECT
        DATE(created_at) as day,
        COUNT(*) as leads
      FROM leads
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY day
      ORDER BY day
    `)

    res.json({
      success: true,
      data: result.rows
    })

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Failed to fetch lead trend"
    })

  }

}