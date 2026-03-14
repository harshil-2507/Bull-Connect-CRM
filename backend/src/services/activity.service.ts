import { pool } from "../config/db"

export class ActivityService {

  async log(
    leadId: string,
    type: string,
    description: string,
    userId?: string
  ) {

    await pool.query(
      `
      INSERT INTO lead_activities
      (lead_id, activity_type, description, created_by)
      VALUES ($1,$2,$3,$4)
      `,
      [
        leadId,
        type,
        description,
        userId || null
      ]
    )

  }

}