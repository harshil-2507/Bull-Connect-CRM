import { PoolClient } from "pg";

export class LeadRepository {
  async updateState(tx: PoolClient, leadId: string, state: string) {
    await tx.query(
      `
      UPDATE leads
      SET state = $2
      WHERE id = $1
      `,
      [leadId, state]
    );
  }
}