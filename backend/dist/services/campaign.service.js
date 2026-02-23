"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignService = void 0;
const db_1 = require("../config/db");
const csv_parser_1 = __importDefault(require("csv-parser"));
const stream_1 = require("stream");
class CampaignService {
    async createCampaign(input) {
        if (input.start_date && input.end_date) {
            const start = new Date(input.start_date);
            const end = new Date(input.end_date);
            if (end < start) {
                throw new Error("End date cannot be before start date");
            }
        }
        const res = await db_1.pool.query(`
      INSERT INTO campaigns
      (name, description, start_date, end_date, created_by)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
      `, [
            input.name,
            input.description || null,
            input.start_date || null,
            input.end_date || null,
            input.created_by,
        ]);
        return res.rows[0];
    }
    async getAllCampaigns(options) {
        const offset = (options.page - 1) * options.limit;
        const values = [];
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
        const dataResult = await db_1.pool.query(dataQuery, [...values, options.limit, offset]);
        const countQuery = `
      SELECT COUNT(*) 
      FROM campaigns c
      ${whereClause}
    `;
        const countResult = await db_1.pool.query(countQuery, values);
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
    async getCampaignById(id) {
        const res = await db_1.pool.query(`
      SELECT 
        c.*,
        COUNT(l.id) AS total_leads
      FROM campaigns c
      LEFT JOIN leads l ON l.campaign_id = c.id
      WHERE c.id = $1
      GROUP BY c.id
      `, [id]);
        if (!res.rowCount) {
            throw new Error("Campaign not found");
        }
        return res.rows[0];
    }
    async toggleCampaign(id, isActive) {
        const res = await db_1.pool.query(`
      UPDATE campaigns
      SET is_active = $1
      WHERE id = $2
      RETURNING *
      `, [isActive, id]);
        if (!res.rowCount) {
            throw new Error("Campaign not found");
        }
        return res.rows[0];
    }
    async getLeadsByCampaign(campaignId, options) {
        const page = options?.page || 1;
        const limit = options?.limit || 10;
        const offset = (page - 1) * limit;
        const campaignCheck = await db_1.pool.query(`SELECT id FROM campaigns WHERE id = $1`, [campaignId]);
        if (!campaignCheck.rowCount) {
            throw new Error("Campaign not found");
        }
        const dataResult = await db_1.pool.query(`
      SELECT *
      FROM leads
      WHERE campaign_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
      `, [campaignId, limit, offset]);
        const countResult = await db_1.pool.query(`SELECT COUNT(*) FROM leads WHERE campaign_id = $1`, [campaignId]);
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
    async getCampaignStatsById(id) {
        const res = await db_1.pool.query(`
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
      `, [id]);
        if (!res.rowCount) {
            throw new Error("Campaign not found");
        }
        return res.rows[0];
    }
    async getAllCampaignStats() {
        const res = await db_1.pool.query(`
      SELECT 
        c.id,
        c.name,
        COUNT(l.id) AS total_leads
      FROM campaigns c
      LEFT JOIN leads l ON l.campaign_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
      `);
        return res.rows;
    }
    async getCampaignPipeline(id) {
        const campaignRes = await db_1.pool.query(`SELECT id, name FROM campaigns WHERE id = $1`, [id]);
        if (!campaignRes.rowCount) {
            throw new Error("Campaign not found");
        }
        const leadsRes = await db_1.pool.query(`
      SELECT id, name, phone, lead_status, created_at
      FROM leads
      WHERE campaign_id = $1
      ORDER BY created_at DESC
      `, [id]);
        const pipeline = {
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
    async uploadCsvToCampaign(campaignId, fileBuffer) {
        const client = await db_1.pool.connect();
        try {
            const campaignCheck = await client.query(`SELECT id FROM campaigns WHERE id = $1`, [campaignId]);
            if (!campaignCheck.rowCount) {
                throw new Error("Campaign not found");
            }
            await client.query("BEGIN");
            let totalRows = 0;
            let inserted = 0;
            let duplicates = 0;
            let invalid = 0;
            const batchSize = 5000;
            let batch = [];
            const insertBatch = async () => {
                if (batch.length === 0)
                    return;
                const values = [];
                const placeholders = batch
                    .map((row, index) => {
                    const base = index * 6;
                    values.push(row.name, row.phone, row.taluka, row.district, row.geo_state, campaignId);
                    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
                })
                    .join(",");
                const res = await client.query(`
          INSERT INTO leads
          (name, phone, taluka, district, geo_state, campaign_id)
          VALUES ${placeholders}
          ON CONFLICT (phone) DO NOTHING
          `, values);
                const affectedRows = res.rowCount ?? 0;
                inserted += affectedRows;
                duplicates += batch.length - affectedRows;
                batch = [];
            };
            const stream = stream_1.Readable.from(fileBuffer);
            await new Promise((resolve, reject) => {
                stream
                    .pipe((0, csv_parser_1.default)())
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
                    }
                    else {
                        stream.resume();
                    }
                })
                    .on("end", async () => {
                    try {
                        await insertBatch();
                        resolve();
                    }
                    catch (err) {
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
exports.CampaignService = CampaignService;
