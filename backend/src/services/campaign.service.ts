import { pool } from "../config/db";

export type CampaignInput = {
    name: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    created_by: number;
};

export class CampaignService {
    /**
     * Create Campaign
     */
    async createCampaign(input: CampaignInput) {
        // Validate date logic BEFORE insert
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

    /**
     * Get All Campaigns
     * Supports:
     * - Pagination
     * - Active filtering
     */
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

    /**
     * Get Single Campaign by ID
     */
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

    /**
     * Toggle Campaign Active Status
     */
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

    /**
     * Get Leads Under a Campaign (Paginated)
     */
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
            `
      SELECT COUNT(*) 
      FROM leads
      WHERE campaign_id = $1
      `,
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

    /**
     * Get Stats for ONE Campaign
     */
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

    /**
     * Get Stats for ALL Campaigns
     */
    async getAllCampaignStats() {
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
        GROUP BY campaign_id
      ) stats ON stats.campaign_id = c.id
      ORDER BY c.created_at DESC
      `
        );

        return res.rows;
    }





    async getCampaignPipeline(id: string) {
        // Check campaign exists
        const campaignRes = await pool.query(
            `SELECT id, name FROM campaigns WHERE id = $1`,
            [id]
        );

        if (!campaignRes.rowCount) {
            throw new Error("Campaign not found");
        }

        const campaign = campaignRes.rows[0];

        const leadsRes = await pool.query(
            `
    SELECT 
      id,
      name,
      phone,
      lead_status,
      created_at
    FROM leads
    WHERE campaign_id = $1
    ORDER BY created_at DESC
    `,
            [id]
        );

        const pipeline = {
            UNASSIGNED: [],
            TELE_PROSPECTING: [],
            FIELD_VISIT_PENDING: [],
            FIELD_VERIFICATION: [],
            CONVERTED: [],
            DROPPED: [],
        } as Record<string, any[]>;

        for (const lead of leadsRes.rows) {
            if (pipeline[lead.lead_status]) {
                pipeline[lead.lead_status].push(lead);
            }
        }

        return {
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            pipeline,
        };
    }
}