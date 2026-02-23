import { pool } from "../config/db";
import csv from "csv-parser";
import { Readable } from "stream";

export type CampaignInput = {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
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
      (name, description, start_date, end_date, created_by)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
      `,
      [
        input.name,
        input.description || null,
        input.start_date || null,
        input.end_date || null,
        input.created_by,
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

    const dataQuery = `
      SELECT 
        c.*,
        COUNT(l.id) AS total_leads
      FROM campaigns c
      LEFT JOIN leads l ON l.campaign_id = c.id
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT $${index++}
      OFFSET $${index}
    `;

    const dataResult = await pool.query(
      dataQuery,
      [...values, options.limit, offset]
    );

    const countQuery = `
      SELECT COUNT(*) 
      FROM campaigns c
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, values);
    const total = Number(countResult.rows[0].count);

    return {
      data: dataResult.rows,
      pagination: {
        total,
        page: options.page,
        limit: options.limit,
        total_pages: Math.ceil(total / options.limit),
      },
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

  async toggleCampaign(id: string, isActive: boolean) {
    const res = await pool.query(
      `
      UPDATE campaigns
      SET is_active = $1
      WHERE id = $2
      RETURNING *
      `,
      [isActive, id]
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

    const dataResult = await pool.query(
      `
      SELECT *
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
      data: dataResult.rows,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getCampaignStatsById(id: string) {
    const res = await pool.query(
      `
      SELECT 
        c.id,
        c.name,
        COALESCE(stats.total_leads, 0) AS total_leads,
        COALESCE(stats.unassigned, 0) AS unassigned,
        COALESCE(stats.tele_prospecting, 0) AS tele_prospecting,
        COALESCE(stats.field_visit_pending, 0) AS field_visit_pending,
        COALESCE(stats.field_verification, 0) AS field_verification,
        COALESCE(stats.converted, 0) AS converted,
        COALESCE(stats.dropped, 0) AS dropped
      FROM campaigns c
      LEFT JOIN (
        SELECT 
          campaign_id,
          COUNT(*) AS total_leads,
          COUNT(*) FILTER (WHERE lead_status = 'UNASSIGNED') AS unassigned,
          COUNT(*) FILTER (WHERE lead_status = 'TELE_PROSPECTING') AS tele_prospecting,
          COUNT(*) FILTER (WHERE lead_status = 'FIELD_VISIT_PENDING') AS field_visit_pending,
          COUNT(*) FILTER (WHERE lead_status = 'FIELD_VERIFICATION') AS field_verification,
          COUNT(*) FILTER (WHERE lead_status = 'CONVERTED') AS converted,
          COUNT(*) FILTER (WHERE lead_status = 'DROPPED') AS dropped
        FROM leads
        WHERE campaign_id = $1
        GROUP BY campaign_id
      ) stats ON stats.campaign_id = c.id
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
      SELECT id, name, phone, lead_status, created_at
      FROM leads
      WHERE campaign_id = $1
      ORDER BY created_at DESC
      `,
      [id]
    );

    const pipeline: Record<string, any[]> = {
      UNASSIGNED: [],
      TELE_PROSPECTING: [],
      FIELD_VISIT_PENDING: [],
      FIELD_VERIFICATION: [],
      CONVERTED: [],
      DROPPED: [],
    };

    for (const lead of leadsRes.rows) {
      if (pipeline[lead.lead_status]) {
        pipeline[lead.lead_status].push(lead);
      }
    }

    return {
      campaign_id: id,
      campaign_name: campaignRes.rows[0].name,
      pipeline,
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
        if (batch.length === 0) return;

        const values: any[] = [];
        const placeholders = batch
          .map((row, index) => {
            const base = index * 6;
            values.push(
              row.name,
              row.phone,
              row.taluka,
              row.district,
              row.geo_state,
              campaignId
            );
            return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
          })
          .join(",");

        const res = await client.query(
          `
          INSERT INTO leads
          (name, phone, taluka, district, geo_state, campaign_id)
          VALUES ${placeholders}
          ON CONFLICT (phone) DO NOTHING
          `,
          values
        );

        const affectedRows = res.rowCount ?? 0;

        inserted += affectedRows;
        duplicates += batch.length - affectedRows;

        batch = [];
      };

      const stream = Readable.from(fileBuffer);

      await new Promise<void>((resolve, reject) => {
        stream
          .pipe(csv())
          .on("data", async (row) => {
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
              geo_state,
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
        invalid,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}