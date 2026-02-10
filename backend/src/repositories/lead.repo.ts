import { PoolClient } from "pg";
import { LeadState } from "../services/leadStateMachine";

export class LeadRepository {
  async lock(tx: PoolClient, leadId: string) {
    const res = await tx.query(
      `SELECT id, lead_status FROM leads WHERE id = $1 FOR UPDATE`,
      [leadId]
    );
    if (!res.rowCount) throw new Error("Lead not found");
    return res.rows[0]; // { id: string; lead_status: LeadState }
  }

  async updateState(tx: PoolClient, leadId: string, state: LeadState) {
    await tx.query(
      `UPDATE leads SET lead_status = $1 WHERE id = $2`,
      [state, leadId]
    );
  }
}
