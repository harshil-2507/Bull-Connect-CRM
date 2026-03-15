import { pool } from "../config/db";
import csv from "csv-parser";
import { Readable } from "stream";

export type CampaignInput = {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  region?: string;
  created_by: string;
};

export class CampaignService {

  async createCampaign(input: CampaignInput) {

    if (input.start_date && input.end_date) {
      const start = new Date(input.start_date);
      const end = new Date(input.end_date);

      if (end < start) {
        throw new Error("End date cannot be before start date");
      }
    }

    const res = await pool.query(
      `
      INSERT INTO campaigns
      (name, description, start_date, end_date, region, created_by)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        input.name,
        input.description || null,
        input.start_date || null,
        input.end_date || null,
        input.region || null,
        input.created_by
      ]
    );

    return res.rows[0];
  }


  async getAllCampaigns(options: {
    page: number;
    limit: number;
    isActive?: boolean;
  }) {

    const offset = (options.page - 1) * options.limit;

    const values: any[] = [];
    let index = 1;
    let whereClause = "";

    if (options.isActive !== undefined) {
      whereClause = `WHERE c.is_active = $${index++}`;
      values.push(options.isActive);
    }

    const dataResult = await pool.query(
      `
      SELECT
        c.id,
        c.name,
        c.region,
        c.status,
        c.start_date,
        c.end_date,
        c.created_at,
        COUNT(l.id) AS total_leads
      FROM campaigns c
      LEFT JOIN leads l ON l.campaign_id = c.id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT $${index++}
      OFFSET $${index}
      `,
      [...values, options.limit, offset]
    );

    const countResult = await pool.query(
      `
      SELECT COUNT(*)
      FROM campaigns c
      ${whereClause}
      `,
      values
    );

    const total = Number(countResult.rows[0].count);

    return {
      data: dataResult.rows,
      pagination: {
        total,
        page: options.page,
        limit: options.limit,
        total_pages: Math.ceil(total / options.limit)
      }
    };
  }


  async getCampaignById(id: string) {

    const res = await pool.query(
      `
      SELECT
        c.*,
        COUNT(l.id) AS total_leads
      FROM campaigns c
      LEFT JOIN leads l ON l.campaign_id = c.id
      WHERE c.id = $1
      GROUP BY c.id
      `,
      [id]
    );

    if (!res.rowCount) {
      throw new Error("Campaign not found");
    }

    return res.rows[0];
  }


  // async toggleCampaign(id: string, isActive: boolean) {

  //   const res = await pool.query(
  //     `
  //     UPDATE campaigns
  //     SET is_active = $1
  //     WHERE id = $2
  //     RETURNING *
  //     `,
  //     [isActive, id]
  //   );

  //   if (!res.rowCount) {
  //     throw new Error("Campaign not found");
  //   }

  //   return res.rows[0];
  // }


  async updateCampaignStatus(id: string, status: string) {

    const allowed = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"];

    if (!allowed.includes(status)) {
      throw new Error("Invalid campaign status");
    }

    const res = await pool.query(
      `
      UPDATE campaigns
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    if (!res.rowCount) {
      throw new Error("Campaign not found");
    }

    return res.rows[0];
  }


  async getLeadsByCampaign(
    campaignId: string,
    options?: { page?: number; limit?: number }
  ) {

    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const offset = (page - 1) * limit;

    const campaignCheck = await pool.query(
      `SELECT id FROM campaigns WHERE id = $1`,
      [campaignId]
    );

    if (!campaignCheck.rowCount) {
      throw new Error("Campaign not found");
    }

    const leads = await pool.query(
      `
      SELECT
  id,
  farmer_name AS name,
  phone_number AS phone,
  village,
  taluka,
  district,
  state,
  status,
  assigned_to,
  created_at
FROM leads
WHERE campaign_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3
      `,
      [campaignId, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM leads WHERE campaign_id = $1`,
      [campaignId]
    );

    const total = Number(countResult.rows[0].count);

    return {
      data: leads.rows,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      }
    };
  }


  async getCampaignStatsById(id: string) {

    const res = await pool.query(
      `
      SELECT 
  c.id,
  c.name,

  COALESCE(stats.total_leads,0) AS total_leads,
  COALESCE(stats.new_leads,0) AS new_leads,
  COALESCE(stats.assigned,0) AS assigned,
  COALESCE(stats.contacted,0) AS contacted,
  COALESCE(stats.field_requested,0) AS field_requested,
  COALESCE(stats.visit_requested,0) AS visit_requested,
  COALESCE(stats.visit_assigned,0) AS visit_assigned,
  COALESCE(stats.visit_completed,0) AS visit_completed,
  COALESCE(stats.sold,0) AS sold,
  COALESCE(stats.dropped,0) AS dropped

FROM campaigns c

LEFT JOIN (

SELECT
  campaign_id,

  COUNT(*) AS total_leads,

  COUNT(*) FILTER (WHERE status = 'NEW') AS new_leads,
  COUNT(*) FILTER (WHERE status = 'ASSIGNED') AS assigned,
  COUNT(*) FILTER (WHERE status = 'CONTACTED') AS contacted,
  COUNT(*) FILTER (WHERE status = 'FIELD_REQUESTED') AS field_requested,
  COUNT(*) FILTER (WHERE status = 'VISIT_REQUESTED') AS visit_requested,
  COUNT(*) FILTER (WHERE status = 'VISIT_ASSIGNED') AS visit_assigned,
  COUNT(*) FILTER (WHERE status = 'VISIT_COMPLETED') AS visit_completed,
  COUNT(*) FILTER (WHERE status = 'SOLD') AS sold,
  COUNT(*) FILTER (WHERE status = 'DROPPED') AS dropped

FROM leads
WHERE campaign_id = $1
GROUP BY campaign_id

) stats

ON stats.campaign_id = c.id

WHERE c.id = $1
      `,
      [id]
    );

    if (!res.rowCount) {
      throw new Error("Campaign not found");
    }

    return res.rows[0];
  }


  async getAllCampaignStats() {

    const res = await pool.query(
      `
      SELECT
        c.id,
        c.name,
        c.status,
        COUNT(l.id) AS total_leads
      FROM campaigns c
      LEFT JOIN leads l ON l.campaign_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
      `
    );

    return res.rows;
  }


  async getCampaignPipeline(id: string) {

    const campaignRes = await pool.query(
      `SELECT id, name FROM campaigns WHERE id = $1`,
      [id]
    );

    if (!campaignRes.rowCount) {
      throw new Error("Campaign not found");
    }

    const leadsRes = await pool.query(
      `
      SELECT
  id,
  farmer_name AS name,
  phone_number AS phone,
  status,
  created_at
FROM leads
WHERE campaign_id = $1
ORDER BY created_at DESC
      `,
      [id]
    );

    const pipeline: Record<string, any[]> = {

  NEW: [],
  ASSIGNED: [],
  CONTACTED: [],
  FIELD_REQUESTED: [],
  VISIT_REQUESTED: [],
  VISIT_ASSIGNED: [],
  VISIT_COMPLETED: [],
  SOLD: [],
  DROPPED: []

};

    for (const lead of leadsRes.rows) {
      if (pipeline[lead.status]) {
        pipeline[lead.status].push(lead);
      }
    }

    return {
      campaign_id: id,
      campaign_name: campaignRes.rows[0].name,
      pipeline
    };
  }


  async uploadCsvToCampaign(campaignId: string, fileBuffer: Buffer) {

    const client = await pool.connect();

    try {

      const campaignCheck = await client.query(
        `SELECT id FROM campaigns WHERE id = $1`,
        [campaignId]
      );

      if (!campaignCheck.rowCount) {
        throw new Error("Campaign not found");
      }

      await client.query("BEGIN");

      let totalRows = 0;
      let inserted = 0;
      let duplicates = 0;
      let invalid = 0;

      const batchSize = 5000;
      let batch: any[] = [];

      const insertBatch = async () => {

        if (!batch.length) return;

        const values: any[] = [];

        const placeholders = batch
          .map((row, i) => {

            const base = i * 6;

            values.push(
              row.name,
              row.phone,
              row.taluka,
              row.district,
              row.geo_state,
              campaignId
            );

            return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6})`;

          })
          .join(",");

        const res = await client.query(
          `
          INSERT INTO leads
          (farmer_name,phone_number, taluka,district,geo_state,campaign_id)
          VALUES ${placeholders}
          ON CONFLICT (phone_number) DO NOTHING
          `,
          values
        );

        const affected = res.rowCount ?? 0;

        inserted += affected;
        duplicates += batch.length - affected;

        batch = [];

      };

      const stream = Readable.from(fileBuffer);

      await new Promise<void>((resolve, reject) => {

        stream
          .pipe(csv())
          .on("data", (row) => {

            stream.pause();

            totalRows++;

            const name = row.name?.trim();
            const phone = row.phone?.trim();
            const taluka = row.taluka?.trim() || null;
            const district = row.district?.trim() || null;
            const geo_state = row.geo_state?.trim() || null;

            if (!phone || !/^\d{10,15}$/.test(phone)) {
              invalid++;
              stream.resume();
              return;
            }

            batch.push({
              name: name || "Unknown",
              phone,
              taluka,
              district,
              geo_state
            });

            if (batch.length >= batchSize) {

              insertBatch()
                .then(() => stream.resume())
                .catch(reject);

            } else {

              stream.resume();

            }

          })
          .on("end", async () => {

            try {

              await insertBatch();
              resolve();

            } catch (err) {
              reject(err);
            }

          })
          .on("error", reject);

      });

      await client.query("COMMIT");

      return {
        totalRows,
        inserted,
        duplicates,
        invalid
      };

    } catch (err) {

      await client.query("ROLLBACK");
      throw err;

    } finally {

      client.release();

    }

  }

}