import { PoolClient } from "pg";
import { LeadState } from "../services/leadStateMachine";

export class LeadRepository {
  async lock(tx: PoolClient, leadId: string) {
    const res = await tx.query(
      `SELECT id, state FROM leads WHERE id = $1 FOR UPDATE`,
      [leadId]
    );
    if (!res.rowCount) throw new Error("Lead not found");
    return res.rows[0] as { id: string; state: LeadState };
  }

  async updateState(tx: PoolClient, leadId: string, state: LeadState) {
    await tx.query(`UPDATE leads SET state = $2 WHERE id = $1`, [
      leadId,
      state,
    ]);
  }
}