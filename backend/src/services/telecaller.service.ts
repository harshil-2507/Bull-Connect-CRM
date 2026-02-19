import { pool } from "../config/db";

export class TelecallerService {
  /**
   * Get Telecaller Work Queue (Phase 1 - FIFO)
   */
  async getWorkQueue(telecallerId: number) {
    const res = await pool.query(
      `
      SELECT 
        l.id,
        l.name,
        l.phone,
        l.taluka,
        l.district,
        l.geo_state,
        l.lead_status,
        l.created_at,
        t.assigned_at
      FROM tele_assignments t
      JOIN leads l ON l.id = t.lead_id
      WHERE 
        t.user_id = $1
        AND l.lead_status = 'TELE_PROSPECTING'
      ORDER BY t.assigned_at ASC
      `,
      [telecallerId]
    );

    return res.rows;
  }
}