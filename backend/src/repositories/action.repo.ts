import { PoolClient } from "pg";

/**
 * Handles call-related persistence
 * No business logic here
 */
export class ActionRepository {
  async createCallAction(
    tx: PoolClient,
    leadId: string,
    telecallerId: string,
    disposition: string,
    notes: string | null
  ) {
    await tx.query(
      `
      INSERT INTO call_actions
        (lead_id, telecaller_id, disposition, notes)
      VALUES ($1, $2, $3, $4)
      `,
      [leadId, telecallerId, disposition, notes]
    );
  }
}