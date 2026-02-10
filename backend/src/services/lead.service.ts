import { pool } from "../config/db";

export type LeadInput = {
  name: string;
  phone: string;
  taluka?: string;
  district?: string;
  geo_state?: string;
  lead_status: "UNASSIGNED";// default UNASSIGNED
};

export class LeadService {
  async createLead(input: LeadInput) {
    const res = await pool.query(
      `INSERT INTO leads
       (name, phone, taluka, district, geo_state, lead_status)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [
        input.name,
        input.phone,
        input.taluka || null,
        input.district || null,
        input.geo_state || null,
        input.lead_status || "UNASSIGNED",
      ]
    );
    return res.rows[0];
  }

  async getAllLeads() {
    const res = await pool.query(`SELECT * FROM leads ORDER BY created_at DESC`);
    return res.rows;
  }

  async getLeadById(id: string) {
    const res = await pool.query(`SELECT * FROM leads WHERE id = $1`, [id]);
    if (!res.rowCount) throw new Error("Lead not found");
    return res.rows[0];
  }
}
