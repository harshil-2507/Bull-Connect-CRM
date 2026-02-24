// backend/src/services/visit.service.ts

import { PoolClient } from "pg";
import { pool } from "../config/db";
import { assertValidTransition } from "./leadStateMachine";
import { VisitRequestRepository } from "../repositories/visitRequest.repository";
import { VisitRepository } from "../repositories/visit.repository";
import { LeadState } from "../models/lead.model";

export class VisitService {
  private visitRequestRepo = new VisitRequestRepository();
  private visitRepo = new VisitRepository();

  // =====================================================
  // 🔹 Helper: Get Lead Status Safely (Inside Transaction)
  // =====================================================
  private async getLeadStatus(
    client: PoolClient,
    leadId: string
  ): Promise<LeadState> {
    const res = await client.query(
      `SELECT status FROM leads WHERE id = $1`,
      [leadId]
    );

    if (!res.rows.length) {
      throw new Error("Lead not found");
    }

    return res.rows[0].status;
  }

  // =====================================================
  // 🥇 TELECALLER → Request Visit
  // =====================================================
  async requestVisit(
    leadId: string,
    requestedBy: string,
    notes?: string
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const currentStatus = await this.getLeadStatus(client, leadId);

      assertValidTransition(currentStatus, "VISIT_REQUESTED");

      await client.query(
        `UPDATE leads 
         SET status = 'VISIT_REQUESTED',
             updated_at = NOW()
         WHERE id = $1`,
        [leadId]
      );

      const visitRequest = await this.visitRequestRepo.create(client, {
        leadId,
        requestedBy,
        notes,
      });

      await client.query("COMMIT");
      return visitRequest;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // =====================================================
  // 🥈 GROUND MANAGER → Assign Visit
  // =====================================================
  async assignVisit(
    visitRequestId: string,
    fieldExecId: string,
    managerId: string,
    scheduledAt?: Date
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const visit = await this.visitRepo.create(client, {
        visitRequestId,
        fieldExecId,
        assignedBy: managerId,
        scheduledAt,
      });

      const currentStatus = await this.getLeadStatus(
        client,
        visit.leadId
      );

      assertValidTransition(currentStatus, "VISIT_ASSIGNED");

      await client.query(
        `UPDATE leads 
         SET status = 'VISIT_ASSIGNED',
             updated_at = NOW()
         WHERE id = $1`,
        [visit.leadId]
      );

      await this.visitRequestRepo.updateStatus(
        client,
        visitRequestId,
        "ASSIGNED"
      );

      await client.query("COMMIT");
      return visit;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // =====================================================
  // 🥉 FIELD EXEC → Start Visit
  // =====================================================
  async startVisit(
    visitId: string,
    startLat: number,
    startLng: number
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const res = await client.query(
        `SELECT status FROM visits WHERE id = $1`,
        [visitId]
      );

      if (!res.rows.length) {
        throw new Error("Visit not found");
      }

      if (res.rows[0].status !== "SCHEDULED") {
        throw new Error(
          "Visit must be SCHEDULED to start"
        );
      }

      await client.query(
        `
        UPDATE visits
        SET
          status = 'IN_PROGRESS',
          started_at = NOW(),
          start_lat = $1,
          start_lng = $2,
          updated_at = NOW()
        WHERE id = $3
        `,
        [startLat, startLng, visitId]
      );

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  // =====================================================
  // 🏁 FIELD EXEC → Complete Visit
  // =====================================================
  async completeVisit(
    visitId: string,
    outcome: "SOLD" | "WAITING" | "DROPPED" | "QUALITY_REJECTED",
    outcomeNotes?: string,
    endLat?: number,
    endLng?: number
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const visitRes = await client.query(
        `SELECT lead_id FROM visits WHERE id = $1`,
        [visitId]
      );

      if (!visitRes.rows.length) {
        throw new Error("Visit not found");
      }

      const leadId = visitRes.rows[0].lead_id;

      await this.visitRepo.completeVisit(
        client,
        visitId,
        outcome,
        outcomeNotes,
        endLat,
        endLng
      );

      const currentStatus = await this.getLeadStatus(
        client,
        leadId
      );

      assertValidTransition(currentStatus, "VISIT_COMPLETED");

      await client.query(
        `UPDATE leads 
         SET status = 'VISIT_COMPLETED',
             updated_at = NOW()
         WHERE id = $1`,
        [leadId]
      );

      // Re-check after update
      const updatedStatus = await this.getLeadStatus(
        client,
        leadId
      );

      if (outcome === "SOLD") {
        assertValidTransition(updatedStatus, "SOLD");

        await client.query(
          `UPDATE leads 
           SET status = 'SOLD',
               updated_at = NOW()
           WHERE id = $1`,
          [leadId]
        );
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}