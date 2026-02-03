import { PoolClient } from "pg";

export class PointsService {
  async award(
    tx: PoolClient,
    userId: string,
    leadId: string,
    points: number,
    reason: string
  ) {
    await tx.query(
      `
      INSERT INTO point_events (user_id, lead_id, points, reason)
      VALUES ($1, $2, $3, $4)
      `,
      [userId, leadId, points, reason]
    );
  }
}