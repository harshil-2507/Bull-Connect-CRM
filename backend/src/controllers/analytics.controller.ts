import { Request, Response } from "express"
import { pool } from "../config/db"

export const getLeadFunnel = async (req: Request, res: Response) => {
  try {

    const result = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM leads
      GROUP BY status
      ORDER BY count DESC
    `)

    res.json({
      success: true,
      data: result.rows
    })

  } catch (error: any) {

    console.error("FUNNEL ERROR:", error)

    res.status(500).json({
      success: false,
      message: error.message
    })

  }
}

export const getLeadStatusDistribution = async (req: Request, res: Response) => {
  try {

    const result = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM leads
      GROUP BY status
    `)

    res.json({
      success: true,
      data: result.rows
    })

  } catch (error: any) {

    console.error("STATUS ERROR:", error)

    res.status(500).json({
      success: false,
      message: error.message
    })

  }
}

export const getLeadTrend = async (req: Request, res: Response) => {
  try {

    const result = await pool.query(`
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

  } catch (error: any) {

    console.error("TREND ERROR:", error)

    res.status(500).json({
      success: false,
      message: error.message
    })

  }
}