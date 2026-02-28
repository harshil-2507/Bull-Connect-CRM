import { pool } from "../config/db";
import { INITIAL_LEAD_STATUS } from "../constants/leadStates";

export type LeadInput = {
  farmer_name: string;
  phone_number: string;
  village?: string;
  taluka?: string;
  district?: string;
  state?: string;
  campaign_id: number;
  status: "NEW";
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
       (farmer_name, phone_number, village, taluka, district, state, status, campaign_id, lead_status_v2)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        input.farmer_name,
        input.phone_number,
        input.village || null,
        input.taluka || null,
        input.district || null,
        input.state || null,
        input.status,
        input.campaign_id,
        INITIAL_LEAD_STATUS,
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
      l.farmer_name,
      l.phone_number,
      l.village,
      l.taluka,
      l.district,
      l.state,
      l.status,
      l.lead_status_v2,
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
      l.farmer_name,
      l.phone_number,
      l.village,
      l.taluka,
      l.district,
      l.state,
      l.status,
      l.lead_status_v2,
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
