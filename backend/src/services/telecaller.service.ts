import { pool } from "../config/db";

export class TelecallerService {
  /**
   * Get Telecaller Work Queue (Phase 1 - FIFO)
   */
  async getWorkQueue(telecallerId: String) {
    const res = await pool.query(
      `
      SELECT 
        l.id,
        l.farmer_name,
        l.phone_number,
        l.village,
        l.taluka,
        l.district,
        l.state,
        l.status,
        l.created_at,
        t.assigned_at
      FROM assignments t
      JOIN leads l ON l.id = t.lead_id
      WHERE 
        t.user_id = $1
      ORDER BY t.assigned_at ASC
      `,
      [telecallerId]
    );

    return res.rows;
  }
}