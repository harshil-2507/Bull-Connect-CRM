import { pool } from "../config/db";

export type LeadInput = {
  name: string;
  phone: string;
  taluka?: string;
  district?: string;
  geo_state?: string;
  campaign_id: number;
  lead_status: "UNASSIGNED";
};

export class LeadService {
  async createLead(input: LeadInput) {
  // Validate campaign exists and is active
  const campaignCheck = await pool.query(
    `SELECT id, is_active FROM campaigns WHERE id = $1`,
    [input.campaign_id]
  );

  if (!campaignCheck.rowCount) {
    throw new Error("Campaign not found");
  }

  if (!campaignCheck.rows[0].is_active) {
    throw new Error("Campaign is not active");
  }

  try {
    const res = await pool.query(
      `INSERT INTO leads
       (name, phone, taluka, district, geo_state, lead_status, campaign_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        input.name,
        input.phone,
        input.taluka || null,
        input.district || null,
        input.geo_state || null,
        input.lead_status, // removed fallback
        input.campaign_id,
      ]
    );

    return res.rows[0];
  } catch (err: any) {
    // PostgreSQL unique violation error code
    if (err.code === "23505") {
      throw new Error("Lead with this phone already exists");
    }
    throw err;
  }
}

  async getAllLeads() {
  const res = await pool.query(`
    SELECT 
      l.id,
      l.name,
      l.phone,
      l.taluka,
      l.district,
      l.geo_state,
      l.lead_status,
      l.created_at,
      l.campaign_id,
      c.name AS campaign_name
    FROM leads l
    LEFT JOIN campaigns c ON l.campaign_id = c.id
    ORDER BY l.created_at DESC
  `);

  return res.rows;
}

  async getLeadById(id: string) {
  const res = await pool.query(
    `
    SELECT 
      l.id,
      l.name,
      l.phone,
      l.taluka,
      l.district,
      l.geo_state,
      l.lead_status,
      l.created_at,
      l.campaign_id,
      c.name AS campaign_name
    FROM leads l
    LEFT JOIN campaigns c ON l.campaign_id = c.id
    WHERE l.id = $1
    `,
    [id]
  );

  if (!res.rowCount) throw new Error("Lead not found");

  return res.rows[0];
}
}
