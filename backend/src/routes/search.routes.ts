import { Router } from "express"
import { pool } from "../config/db"

const router = Router()

router.get("/", async (req, res) => {
  const q = `%${req.query.q}%`

  try {

    const leads = await pool.query(
      `
      SELECT id, farmer_name
      FROM leads
      WHERE farmer_name ILIKE $1
      LIMIT 5
      `,
      [q]
    )

    const users = await pool.query(
      `
      SELECT id, name
      FROM users
      WHERE name ILIKE $1
      LIMIT 5
      `,
      [q]
    )

    const campaigns = await pool.query(
      `
      SELECT id, name
      FROM campaigns
      WHERE name ILIKE $1
      LIMIT 5
      `,
      [q]
    )

    res.json({
      leads: leads.rows,
      users: users.rows,
      campaigns: campaigns.rows
    })

  } catch (err) {
    res.status(500).json({ error: "Search failed" })
  }
})

export default router