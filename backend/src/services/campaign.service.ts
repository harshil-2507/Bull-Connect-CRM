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
    // ✅ Date validation BEFORE insert
    if (input.start_date && input.end_date) {
      const start = new Date(input.start_date);
      const end = new Date(input.end_date);

      if (end < start) {
        throw new Error("End date cannot be before start date");
      }
    }

    const res = await pool.query(
      `INSERT INTO campaigns
       (name, description, start_date, end_date, created_by)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
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
   * Get All Campaigns with:
   * - Pagination
   * - Filtering
   * - Total Lead Count
   */
  async getAllCampaigns(options: {
    page: number;
    limit: number;
    isActive?: boolean;
  }) {
    const offset = (options.page - 1) * options.limit;

    let whereClause = "";
    const values: any[] = [];
    let index = 1;

    if (options.isActive !== undefined) {
      whereClause = `WHERE c.is_active = $${index++}`;
      values.push(options.isActive);
    }

    // Get paginated campaigns
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

    // Get total count (for pagination metadata)
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
   * Get Campaign By ID
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

    if (!res.rowCount) throw new Error("Campaign not found");

    return res.rows[0];
  }

  /**
   * Toggle Campaign Active Status
   */
  async toggleCampaign(id: string, isActive: boolean) {
    const res = await pool.query(
      `UPDATE campaigns
       SET is_active = $1
       WHERE id = $2
       RETURNING *`,
      [isActive, id]
    );

    if (!res.rowCount) throw new Error("Campaign not found");

    return res.rows[0];
  }
}