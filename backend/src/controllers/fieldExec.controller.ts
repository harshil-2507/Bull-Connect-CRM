import { Request, Response } from "express";
import { withTransaction } from "../db/transactions";
import { PointsService } from "../services/points.service";

const pointsService = new PointsService();

export async function verifyLead(req: Request, res: Response) {
  const { leadId, finalStatus } = req.body;
  const fieldExecId = req.user.id;

  await withTransaction(async (tx) => {
    await tx.query(
      `
      INSERT INTO field_verifications
        (lead_id, field_exec_id, gps_checkin_ok, final_status)
      VALUES ($1, $2, true, $3)
      `,
      [leadId, fieldExecId, finalStatus]
    );

    await tx.query(
      `
      UPDATE leads SET state = $2 WHERE id = $1
      `,
      [leadId, finalStatus]
    );

    if (finalStatus === "CONVERTED") {
      await pointsService.award(
        tx,
        fieldExecId,
        leadId,
        10,
        "Lead converted"
      );
    }
  });

  res.json({ success: true });
}