"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssignmentRepository = void 0;
const db_1 = require("../config/db");
class AssignmentRepository {
    async assignTelecaller(tx, leadId, telecallerId, managerId) {
        await tx.query(`
      INSERT INTO assignments (lead_id, user_id, assigned_by)
      VALUES ($1, $2, $3)
      `, [leadId, telecallerId, managerId]);
    }
    async getAllTeleAssignments() {
        const res = await db_1.pool.query(`SELECT * FROM assignments ORDER BY id DESC`);
        return res.rows;
    }
    async getTeleAssignmentById(id) {
        const res = await db_1.pool.query(`SELECT * FROM assignments WHERE id = $1`, [id]);
        return res.rows[0];
    }
    async assignFieldExec(tx, fieldRequestId, fieldExecId, managerId) {
        await tx.query(`
      INSERT INTO field_assignments (field_request_id, field_exec_id, assigned_by)
      VALUES ($1, $2, $3)
      `, [fieldRequestId, fieldExecId, managerId]);
    }
}
exports.AssignmentRepository = AssignmentRepository;
