"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadStateService = void 0;
const transactions_1 = require("../db/transactions");
const lead_repo_1 = require("../repositories/lead.repo");
const assignment_repo_1 = require("../repositories/assignment.repo");
const action_repo_1 = require("../repositories/action.repo");
const leadStateMachine_1 = require("./leadStateMachine");
class LeadStateService {
    constructor() {
        this.leadRepo = new lead_repo_1.LeadRepository();
        this.assignRepo = new assignment_repo_1.AssignmentRepository();
        this.actionRepo = new action_repo_1.ActionRepository();
    }
    async assignTelecaller(leadId, telecallerId, managerId) {
        await (0, transactions_1.withTransaction)(async (tx) => {
            const lead = await this.leadRepo.lock(tx, leadId);
            (0, leadStateMachine_1.assertValidTransition)(lead.lead_status, "TELE_PROSPECTING");
            const res = await tx.query(`SELECT id, role FROM users WHERE id = $1`, [telecallerId]);
            if (!res.rowCount)
                throw new Error("Telecaller not found");
            if (res.rows[0].role !== "TELECALLER")
                throw new Error("User is not a telecaller");
            await this.assignRepo.assignTelecaller(tx, leadId, telecallerId, managerId);
            await this.leadRepo.updateState(tx, leadId, "TELE_PROSPECTING");
        });
    }
    async getAllTeleAssignments() {
        const res = await this.assignRepo.getAllTeleAssignments();
        return res;
    }
    async getTeleAssignmentById(id) {
        const res = await this.assignRepo.getTeleAssignmentById(id);
        if (!res)
            throw new Error("Assignment not found");
        return res;
    }
    async getNextLeadForTelecaller(telecallerId) {
        return (0, transactions_1.withTransaction)(async (tx) => {
            // Find the next lead assigned to this telecaller that is not yet called
            const res = await tx.query(`
        SELECT l.id, l.farmer_name, l.phone_number, l.village, l.taluka, l.district, l.state, l.status
        FROM leads l
        JOIN tele_assignments t ON t.lead_id = l.id
        WHERE t.user_id = $1
          AND l.status IN ('NEW', 'CALLBACK_SCHEDULED')
        ORDER BY t.assigned_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
        `, [telecallerId]);
            if (!res.rowCount)
                return null;
            const lead = res.rows[0];
            // Lock + update the lead state to TELE_PROSPECTING if it was UNASSIGNED
            if (lead.lead_status === "UNASSIGNED") {
                (0, leadStateMachine_1.assertValidTransition)("UNASSIGNED", "TELE_PROSPECTING");
                await this.leadRepo.updateState(tx, lead.id, "TELE_PROSPECTING");
                lead.lead_status = "TELE_PROSPECTING";
            }
            return lead;
        });
    }
    async call(leadId, telecallerId, disposition, notes) {
        await (0, transactions_1.withTransaction)(async (tx) => {
            const lead = await this.leadRepo.lock(tx, leadId);
            const validDispositions = ["INTERESTED", "NOT_INTERESTED", "FOLLOW_UP"];
            if (!validDispositions.includes(disposition)) {
                throw new Error(`Invalid disposition: ${disposition}`);
            }
            // 1️⃣ Always log call
            await this.actionRepo.call(tx, leadId, telecallerId, disposition, notes);
            // 2️⃣ Handle transitions
            if (disposition === "INTERESTED") {
                (0, leadStateMachine_1.assertValidTransition)(lead.lead_status, "FIELD_VISIT_PENDING");
                // 🔥 Create field request entry
                await this.actionRepo.requestFieldVisit(tx, leadId, telecallerId, "UNKNOWN" // we can improve this later
                );
                await this.leadRepo.updateState(tx, leadId, "FIELD_VISIT_PENDING");
            }
            if (disposition === "NOT_INTERESTED") {
                (0, leadStateMachine_1.assertValidTransition)(lead.lead_status, "DROPPED");
                await this.actionRepo.drop(tx, leadId, telecallerId, notes ?? "No reason provided");
                await this.leadRepo.updateState(tx, leadId, "DROPPED");
            }
            if (disposition === "FOLLOW_UP") {
                (0, leadStateMachine_1.assertValidTransition)(lead.lead_status, "TELE_PROSPECTING");
            }
        });
    }
    /**
    * Get all Field Requests
    */
    async getAllFieldRequests() {
        return (0, transactions_1.withTransaction)(async (tx) => {
            const res = await tx.query(`SELECT fr.id, fr.lead_id, fr.requested_by, fr.primary_crop, fr.requested_at
         FROM field_requests fr
         ORDER BY fr.requested_at DESC`);
            return res.rows;
        });
    }
    /**
     * Get Field Request by ID
     */
    async getFieldRequestById(id) {
        return (0, transactions_1.withTransaction)(async (tx) => {
            const res = await tx.query(`SELECT fr.id, fr.lead_id, fr.requested_by, fr.primary_crop, fr.requested_at
         FROM field_requests fr
         WHERE fr.id = $1`, [id]);
            if (!res.rowCount)
                throw new Error("Field request not found");
            return res.rows[0];
        });
    }
    /**
     * Get all Field Verifications
     */
    async getAllFieldVerifications() {
        return (0, transactions_1.withTransaction)(async (tx) => {
            const res = await tx.query(`SELECT fv.id, fv.lead_id, fv.field_exec_id, fv.gps_checkin_ok, fv.photo_ref, fv.final_status, fv.verified_at
         FROM field_verifications fv
         ORDER BY fv.verified_at DESC`);
            return res.rows;
        });
    }
    /**
     * Get Field Verification by ID
     */
    async getFieldVerificationById(id) {
        return (0, transactions_1.withTransaction)(async (tx) => {
            const res = await tx.query(`SELECT fv.id, fv.lead_id, fv.field_exec_id, fv.gps_checkin_ok, fv.photo_ref, fv.final_status, fv.verified_at
         FROM field_verifications fv
         WHERE fv.id = $1`, [id]);
            if (!res.rowCount)
                throw new Error("Field verification not found");
            return res.rows[0];
        });
    }
    async assignFieldExec(fieldRequestId, fieldExecId, managerId) {
        await (0, transactions_1.withTransaction)(async (tx) => {
            await this.assignRepo.assignFieldExec(tx, fieldRequestId, fieldExecId, managerId);
        });
    }
    async verify(leadId, fieldExecId, status, photo) {
        await (0, transactions_1.withTransaction)(async (tx) => {
            const lead = await this.leadRepo.lock(tx, leadId);
            (0, leadStateMachine_1.assertValidTransition)(lead.lead_status, status);
            await this.actionRepo.verify(tx, leadId, fieldExecId, true, photo, status);
            await this.leadRepo.updateState(tx, leadId, status);
        });
    }
    /**
    * Get all assignments for a Field Exec
    */
    async getAssignmentsForExec(fieldExecId) {
        return (0, transactions_1.withTransaction)(async (tx) => {
            const res = await tx.query(`SELECT fa.id, fa.field_request_id, fa.field_exec_id, fa.assigned_by, fa.assigned_at,
                fr.lead_id, fr.primary_crop
         FROM field_assignments fa
         JOIN field_requests fr ON fr.id = fa.field_request_id
         WHERE fa.field_exec_id = $1
         ORDER BY fa.assigned_at DESC`, [fieldExecId]);
            return res.rows;
        });
    }
    /**
     * Get a specific assignment by ID for a Field Exec
     */
    async getAssignmentByIdForExec(id, fieldExecId) {
        return (0, transactions_1.withTransaction)(async (tx) => {
            const res = await tx.query(`SELECT fa.id, fa.field_request_id, fa.field_exec_id, fa.assigned_by, fa.assigned_at,
                fr.lead_id, fr.primary_crop
         FROM field_assignments fa
         JOIN field_requests fr ON fr.id = fa.field_request_id
         WHERE fa.id = $1 AND fa.field_exec_id = $2`, [id, fieldExecId]);
            if (!res.rowCount)
                throw new Error("Assignment not found or not assigned to you");
            return res.rows[0];
        });
    }
}
exports.LeadStateService = LeadStateService;
