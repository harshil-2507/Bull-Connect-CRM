// src/services/telecaller.service.ts

import { pool } from "../config/db";

export class TelecallerService {

  async getWorkQueue(userId: string) {
  const res = await pool.query(
    `
    SELECT l.*
    FROM leads l
    JOIN assignments a ON a.lead_id = l.id
    WHERE a.user_id = $1
      AND a.is_active = true
      AND l.status != 'VISIT_COMPLETED'   -- ✅ FIX HERE
    ORDER BY l.updated_at DESC
    LIMIT 20
    `,
    [userId]
  );

  return res.rows || [];
}
  async getMyStats(userId: string) {

    const res = await pool.query(
      `
      SELECT
        COUNT(*) AS total_calls,

        COUNT(*) FILTER (WHERE disposition = 'INTERESTED') AS interested,
        COUNT(*) FILTER (WHERE disposition = 'NOT_INTERESTED') AS not_interested,
        COUNT(*) FILTER (WHERE disposition = 'CALLBACK') AS callback,
        COUNT(*) FILTER (WHERE disposition = 'NO_ANSWER') AS no_answer

      FROM call_logs
      WHERE user_id = $1
      `,
      [userId]
    );

    const row = res.rows[0] || {};

    return {
      callsMade: Number(row.total_calls) || 0,
      contacted: Number(row.total_calls) || 0,
      interested: Number(row.interested) || 0,
      notInterested: Number(row.not_interested) || 0,
      callback: Number(row.callback) || 0,
      noAnswer: Number(row.no_answer) || 0,
      points: (Number(row.interested) || 0) * 10,
    };
  }

  async getLeaderboard() {

    const res = await pool.query(
      `
      SELECT
        user_id,
        COUNT(*) FILTER (WHERE disposition = 'INTERESTED') * 10 AS points
      FROM call_logs
      GROUP BY user_id
      ORDER BY points DESC
      LIMIT 10
      `
    );

    return res.rows || [];
  }
}