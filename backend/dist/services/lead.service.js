"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadService = void 0;
const db_1 = require("../config/db");
class LeadService {
    async createLead(input) {
        try {
            const res = await db_1.pool.query(`
        INSERT INTO leads (
          farmer_name,
          phone_number,
          village,
          taluka,
          district,
          state,
          farmer_type,
          bull_centre,
          crop_type,
          acreage,
          total_land_bigha,
          interested_in_warehouse,
          previous_experience,
          status
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
        )
        RETURNING *
        `, [
                input.farmer_name,
                input.phone_number,
                input.village || null,
                input.taluka || null,
                input.district || null,
                input.state || null,
                input.farmer_type || null,
                input.bull_centre || null,
                input.crop_type || null,
                input.acreage || null,
                input.total_land_bigha || null,
                input.interested_in_warehouse ?? null,
                input.previous_experience || null,
                "NEW",
            ]);
            return res.rows[0];
        }
        catch (err) {
            if (err.code === "23505") {
                throw new Error("Lead with this phone already exists");
            }
            throw err;
        }
    }
    async updateLead(id, input) {
        const fields = [];
        const values = [];
        let index = 1;
        for (const key in input) {
            fields.push(`${key} = $${index}`);
            values.push(input[key]);
            index++;
        }
        if (!fields.length) {
            throw new Error("No fields provided for update");
        }
        const query = `
    UPDATE leads
    SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${index}
    RETURNING *
  `;
        values.push(id);
        const res = await db_1.pool.query(query, values);
        if (!res.rowCount) {
            throw new Error("Lead not found");
        }
        return res.rows[0];
    }
    async getAllLeads() {
        const res = await db_1.pool.query(`
      SELECT 
        l.id,
        l.farmer_name,
        l.phone_number,
        l.village,
        l.taluka,
        l.district,
        l.state,
        l.farmer_type,
        l.bull_centre,
        l.crop_type,
        l.acreage,
        l.total_land_bigha,
        l.interested_in_warehouse,
        l.previous_experience,
        l.status,
        l.created_at
      FROM leads l
      ORDER BY l.created_at DESC
    `);
        return res.rows;
    }
    async getLeadById(id) {
        const res = await db_1.pool.query(`SELECT * FROM leads WHERE id = $1`, [id]);
        if (!res.rowCount) {
            throw new Error("Lead not found");
        }
        return res.rows[0];
    }
}
exports.LeadService = LeadService;
