"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentService = void 0;
const db_1 = require("../config/db");
class AssignmentService {
    async bulkAssignToTelecaller(campaignId, telecallerId, options) {
        const client = await db_1.pool.connect();
        try {
            await client.query("BEGIN");
            // Validate campaign
            const campaignCheck = await client.query(`SELECT id FROM campaigns WHERE id = $1`, [campaignId]);
            if (!campaignCheck.rowCount) {
                throw new Error("Campaign not found");
            }
            // Validate telecaller
            const userCheck = await client.query(`SELECT id, role FROM users WHERE id = $1`, [telecallerId]);
            if (!userCheck.rowCount) {
                throw new Error("Telecaller not found");
            }
            if (userCheck.rows[0].role !== "TELECALLER") {
                throw new Error("User is not a telecaller");
            }
            let leadsQuery = "";
            let values = [];
            if (options.leadIds?.length) {
                leadsQuery = `
          SELECT id FROM leads
          WHERE id = ANY($1)
          AND campaign_id = $2
          AND status = 'UNASSIGNED'
        `;
                values = [options.leadIds, campaignId];
            }
            else if (options.limit) {
                leadsQuery = `
          SELECT id FROM leads
          WHERE campaign_id = $1
          AND status = 'UNASSIGNED'
          ORDER BY created_at ASC
          LIMIT $2
          FOR UPDATE SKIP LOCKED
        `;
                values = [campaignId, options.limit];
            }
            else {
                throw new Error("Either leadIds or limit must be provided");
            }
            const leadsRes = await client.query(leadsQuery, values);
            if (!leadsRes.rowCount) {
                await client.query("ROLLBACK");
                return { assigned: 0 };
            }
            const leadIdsToAssign = leadsRes.rows.map((row) => row.id);
            const insertValues = [];
            const placeholders = leadIdsToAssign
                .map((leadId, index) => {
                const base = index * 3;
                insertValues.push(leadId, telecallerId, null);
                return `($${base + 1}, $${base + 2}, $${base + 3})`;
            })
                .join(",");
            await client.query(`
        INSERT INTO assignments
        (lead_id, user_id, assigned_by)
        VALUES ${placeholders}
        `, insertValues);
            await client.query(`
        UPDATE leads
        SET status = 'TELE_PROSPECTING'
        WHERE id = ANY($1)
        `, [leadIdsToAssign]);
            await client.query("COMMIT");
            return { assigned: leadIdsToAssign.length };
        }
        catch (err) {
            await client.query("ROLLBACK");
            throw err;
        }
        finally {
            client.release();
        }
    }
}
exports.AssignmentService = AssignmentService;
