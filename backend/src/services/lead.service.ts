import { pool } from "../config/db";
import { ActivityService } from "./activity.service";

export type LeadInput = {
  farmer_name: string;
  phone_number: string;

  alternate_phone?: string;
  farmer_id?: string;

  village?: string;
  taluka?: string;
  district?: string;
  state?: string;

  farmer_type?: string;
  bull_centre?: string;

  source?: string;
  product_type?: string;

  crop_type?: string;
  acreage?: number;

  total_land_bigha?: number;
  interested_in_warehouse?: boolean;
  previous_experience?: boolean;

  experience_or_remarks?: string;

  castor_bori?: number;
  castor_expected_price?: number;
  castor_offered_price?: number;
  castor_expected_harvest_time?: Date;
  castor_vavetar_bigha?: number;
  castor_deal_status?: string;
  castor_intent_to_sell?: string;

  groundnut_bori?: number;
  groundnut_expected_price?: number;
  groundnut_offered_price?: number;
  groundnut_expected_harvest_time?: Date;
  groundnut_vavetar_bigha?: number;
  groundnut_intent_to_sell?: string;
};

export class LeadService {

  private activityService = new ActivityService();

  async createLead(input: LeadInput) {

    const res = await pool.query(
      `
INSERT INTO leads (
farmer_name,
phone_number,
alternate_phone,
farmer_id,

village,
taluka,
district,
state,

farmer_type,
bull_centre,

source,
product_type,

crop_type,
acreage,

total_land_bigha,
interested_in_warehouse,
previous_experience,

experience_or_remarks,

castor_bori,
castor_expected_price,
castor_offered_price,
castor_expected_harvest_time,
castor_vavetar_bigha,
castor_deal_status,
castor_intent_to_sell,

groundnut_bori,
groundnut_expected_price,
groundnut_offered_price,
groundnut_expected_harvest_time,
groundnut_vavetar_bigha,
groundnut_intent_to_sell,

status
)
VALUES (
$1,$2,$3,$4,
$5,$6,$7,$8,
$9,$10,
$11,$12,
$13,$14,
$15,$16,$17,
$18,
$19,$20,$21,$22,$23,$24,$25,
$26,$27,$28,$29,$30,$31,
$32
)
RETURNING *
`,
      [
        input.farmer_name,
        input.phone_number,
        input.alternate_phone || null,
        input.farmer_id || null,

        input.village || null,
        input.taluka || null,
        input.district || null,
        input.state || null,

        input.farmer_type || null,
        input.bull_centre || null,

        input.source || null,
        input.product_type || null,

        input.crop_type || null,
        input.acreage || null,

        input.total_land_bigha || null,
        input.interested_in_warehouse ?? false,
        input.previous_experience ?? false,

        input.experience_or_remarks || null,

        input.castor_bori || null,
        input.castor_expected_price || null,
        input.castor_offered_price || null,
        input.castor_expected_harvest_time || null,
        input.castor_vavetar_bigha || null,
        input.castor_deal_status || null,
        input.castor_intent_to_sell || null,

        input.groundnut_bori || null,
        input.groundnut_expected_price || null,
        input.groundnut_offered_price || null,
        input.groundnut_expected_harvest_time || null,
        input.groundnut_vavetar_bigha || null,
        input.groundnut_intent_to_sell || null,

        "NEW"
      ]
    );

    const lead = res.rows[0];

    await this.activityService.log(
      lead.id,
      "LEAD_CREATED",
      "Lead created"
    );

    return lead;
  }

  async updateLead(id: string, input: Partial<LeadInput>) {

    const allowedFields = [
      "farmer_name",
      "phone_number",
      "alternate_phone",
      "farmer_id",
      "village",
      "taluka",
      "district",
      "state",
      "farmer_type",
      "bull_centre",
      "source",
      "product_type",
      "crop_type",
      "acreage",
      "total_land_bigha",
      "interested_in_warehouse",
      "previous_experience",
      "experience_or_remarks",

      "castor_bori",
      "castor_expected_price",
      "castor_offered_price",
      "castor_expected_harvest_time",
      "castor_vavetar_bigha",
      "castor_deal_status",
      "castor_intent_to_sell",

      "groundnut_bori",
      "groundnut_expected_price",
      "groundnut_offered_price",
      "groundnut_expected_harvest_time",
      "groundnut_vavetar_bigha",
      "groundnut_intent_to_sell"
    ];

    const fields: string[] = [];
    const values: any[] = [];

    let index = 1;

    for (const key in input) {

      if (!allowedFields.includes(key)) continue;

      fields.push(`${key} = $${index}`);
      values.push((input as any)[key]);

      index++;
    }

    if (!fields.length) {
      throw new Error("No valid fields provided");
    }

    const query = `
UPDATE leads
SET ${fields.join(", ")},
updated_at = CURRENT_TIMESTAMP
WHERE id = $${index}
RETURNING *
`;

    values.push(id);

    const res = await pool.query(query, values);

    if (!res.rowCount) {
      throw new Error("Lead not found");
    }

    const lead = res.rows[0];

    await this.activityService.log(
      id,
      "LEAD_UPDATED",
      "Lead field updated"
    );

    return lead;
  }

  async getAllLeads(page = 1, limit = 20) {

    const offset = (page - 1) * limit;

    const leads = await pool.query(
      `
SELECT
id,
farmer_name,
phone_number,
alternate_phone,
farmer_type,
village,
taluka,
district,
bull_centre,
crop_type,
castor_bori,
groundnut_bori,
total_land_bigha,
status,
created_at
FROM leads
ORDER BY created_at DESC
LIMIT $1 OFFSET $2
`,
      [limit, offset]
    );

    const total = await pool.query(`SELECT COUNT(*) FROM leads`);

    return {
      leads: leads.rows,
      total: Number(total.rows[0].count),
      page,
      limit
    };
  }

  async getLeadById(id: string) {

    const res = await pool.query(
      `SELECT * FROM leads WHERE id = $1`,
      [id]
    );

    if (!res.rowCount) throw new Error("Lead not found");

    return res.rows[0];
  }

  async getLeadActivities(leadId: string) {

    const res = await pool.query(
      `
SELECT
id,
activity_type,
description,
created_by,
created_at
FROM lead_activities
WHERE lead_id = $1
ORDER BY created_at DESC
`,
      [leadId]
    );

    return res.rows;
  }
}