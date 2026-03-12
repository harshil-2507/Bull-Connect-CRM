import { pool } from "../config/db";

interface DateFilter {
  from?: string;
  to?: string;
}

interface TelecallerPerformanceFilter extends DateFilter {
  page: number;
  limit: number;
}

export class AdminDashboardService {
  /**
   * ============================================
   * SUMMARY KPIs
   * ============================================
   */
  async getSummary(filters: DateFilter) {
    const { from, to } = filters;

    const dateCondition =
      from && to
        ? `WHERE created_at BETWEEN $1 AND $2`
        : "";

    const params = from && to ? [from, to] : [];

    const totalLeadsQuery = `
      SELECT COUNT(*) AS total
      FROM leads
      ${dateCondition}
    `;

    const activeLeadsQuery = `
      SELECT COUNT(*) AS total
      FROM leads
      ${dateCondition ? dateCondition + " AND" : "WHERE"}
      status NOT IN ('SOLD', 'DROPPED')
    `;

    const soldLeadsQuery = `
      SELECT COUNT(*) AS total
      FROM leads
      ${dateCondition ? dateCondition + " AND" : "WHERE"}
      status = 'SOLD'
    `;

    const visitCompletedQuery = `
      SELECT COUNT(*) AS total
      FROM leads
      ${dateCondition ? dateCondition + " AND" : "WHERE"}
      status = 'VISIT_COMPLETED'
    `;

    const avgAttemptQuery = `
      SELECT AVG(attempt_count) AS avg_attempt
      FROM leads
      ${dateCondition}
    `;

    const revenueQuery = `
      SELECT COALESCE(SUM(expected_value), 0) AS revenue
      FROM deals
      WHERE status = 'SOLD'
    `;

    const visitRequestedQuery = `
  SELECT COUNT(*) AS total
  FROM leads
  ${dateCondition ? dateCondition + " AND" : "WHERE"}
  status = 'VISIT_REQUESTED'
`;
    const [
      totalRes,
      activeRes,
      soldRes,
      visitCompletedRes,
      avgAttemptRes,
      revenueRes,
      visitRequestedRes
    ] = await Promise.all([
      pool.query(totalLeadsQuery, params),
      pool.query(activeLeadsQuery, params),
      pool.query(soldLeadsQuery, params),
      pool.query(visitCompletedQuery, params),
      pool.query(avgAttemptQuery, params),
      pool.query(revenueQuery),
      pool.query(visitRequestedQuery, params)
    ]);

    const totalLeads = Number(totalRes.rows[0].total);
    const soldLeads = Number(soldRes.rows[0].total);
    const visitCompleted = Number(visitCompletedRes.rows[0].total);
    const visitRequested = Number(visitRequestedRes.rows[0].total);

    const conversionRate =
      totalLeads > 0 ? (soldLeads / totalLeads) * 100 : 0;

    const visitConversionRate =
      visitCompleted > 0
        ? (soldLeads / visitCompleted) * 100
        : 0;

    return {
      totalLeads,
      activeLeads: Number(activeRes.rows[0].total),
      soldLeads,
      visitCompleted,
      visitRequested: Number(visitRequestedRes.rows[0].total),
      conversionRate: Number(conversionRate.toFixed(2)),
      visitConversionRate: Number(
        visitConversionRate.toFixed(2)
      ),
      avgAttemptCount: Number(
        avgAttemptRes.rows[0].avg_attempt || 0
      ),
      totalRevenue: Number(revenueRes.rows[0].revenue),
    };
  }

  /**
   * ============================================
   * PIPELINE DISTRIBUTION
   * ============================================
   */
  async getPipeline(filters: DateFilter) {
    const { from, to } = filters;

    const dateCondition =
      from && to
        ? `WHERE created_at BETWEEN $1 AND $2`
        : "";

    const params = from && to ? [from, to] : [];

    const query = `
      SELECT status, COUNT(*) AS count
      FROM leads
      ${dateCondition}
      GROUP BY status
      ORDER BY status
    `;

    const result = await pool.query(query, params);

    return result.rows.map((row) => ({
      status: row.status,
      count: Number(row.count),
    }));
  }

  /**
   * ============================================
   * TELECALLER PERFORMANCE
   * ============================================
   */
  async getTelecallerPerformance(
    filters: TelecallerPerformanceFilter
  ) {
    const { from, to, page, limit } = filters;

    const offset = (page - 1) * limit;

    const params =
      from && to ? [from, to, limit, offset] : [limit, offset];

    const query = `
      SELECT
        u.id,
        u.name,
        COUNT(l.id) AS assigned,
        COUNT(CASE WHEN l.status = 'CONTACTED' THEN 1 END) AS contacted,
        COUNT(CASE WHEN l.status = 'VISIT_REQUESTED' THEN 1 END) AS visit_requested,
        COUNT(CASE WHEN l.status = 'VISIT_COMPLETED' THEN 1 END) AS visit_completed,
        COUNT(CASE WHEN l.status = 'SOLD' THEN 1 END) AS closed,
        AVG(l.attempt_count) AS avg_attempts
      FROM users u
      LEFT JOIN leads l 
        ON l.assigned_to = u.id
        ${from && to ? "AND l.created_at BETWEEN $1 AND $2" : ""}
      WHERE u.role = 'TELECALLER'
      GROUP BY u.id
      ORDER BY closed DESC
      LIMIT $${from && to ? 3 : 1}
      OFFSET $${from && to ? 4 : 2}
    `;

    const result = await pool.query(query, params);

    return result.rows.map((row) => {
      const assigned = Number(row.assigned);
      const closed = Number(row.closed); // ✅ FIXED HERE

      const conversionRate =
        assigned > 0 ? (closed / assigned) * 100 : 0;

      return {
        telecallerId: row.id,
        name: row.name,
        assigned,
        contacted: Number(row.contacted),
        visitRequested: Number(row.visit_requested),
        visitCompleted: Number(row.visit_completed),
        closed,
        conversionRate: Number(conversionRate.toFixed(2)),
        avgAttempts: Number(row.avg_attempts || 0),
      };
    });
  }

  /**
   * ============================================
   * VISIT ANALYTICS
   * ============================================
   */
  async getVisitAnalytics(filters: DateFilter) {
    const query = `
    SELECT
      COUNT(CASE WHEN status = 'VISIT_REQUESTED' THEN 1 END) AS visit_requested,
      COUNT(CASE WHEN status = 'VISIT_ASSIGNED' THEN 1 END) AS visit_assigned,
      COUNT(CASE WHEN status = 'VISIT_COMPLETED' THEN 1 END) AS visit_completed,
      COUNT(CASE WHEN status = 'SOLD' THEN 1 END) AS sold
    FROM leads
  `;

    const result = await pool.query(query);
    const row = result.rows[0];

    const visitCompleted = Number(row.visit_completed);
    const sold = Number(row.sold);

    const visitToSaleRate =
      visitCompleted > 0 ? (sold / visitCompleted) * 100 : 0;

    return {
      visitRequested: Number(row.visit_requested),
      visitAssigned: Number(row.visit_assigned),
      visitCompleted,
      soldAfterVisit: sold,
      visitToSaleRate: Number(visitToSaleRate.toFixed(2)),
    };
  }

  /**
   * ============================================
   * CROP ANALYTICS
   * ============================================
   */
  async getCropAnalytics(filters: DateFilter) {
    const leadsByCropQuery = `
      SELECT crop_type, COUNT(*) AS count
      FROM leads
      WHERE crop_type IS NOT NULL
      GROUP BY crop_type
      ORDER BY count DESC
    `;

    const revenueByCropQuery = `
      SELECT crop_type, SUM(expected_value) AS revenue
      FROM deals
      WHERE status = 'SOLD'
      AND crop_type IS NOT NULL
      GROUP BY crop_type
      ORDER BY revenue DESC
    `;

    const [leadsRes, revenueRes] = await Promise.all([
      pool.query(leadsByCropQuery),
      pool.query(revenueByCropQuery),
    ]);

    return {
      leadsByCrop: leadsRes.rows.map((row) => ({
        crop: row.crop_type,
        count: Number(row.count),
      })),
      revenueByCrop: revenueRes.rows.map((row) => ({
        crop: row.crop_type,
        revenue: Number(row.revenue),
      })),
    };
  }
}