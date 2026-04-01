import { withTransaction } from "../db/transactions";

type Exec = {
    id: string;
    name: string;
    capacity: number;
    current_load: number;
    latitude: number | null;
    longitude: number | null;
};

type Request = {
    id: string;
    lead_id: string;
    latitude: number | null;
    longitude: number | null;
    priority: string;
};
type VisitWithLead = {
  id: string;
  farmer_name: string;
  outcome: string | null;
  visit_notes: string | null;
};

export class FieldManagerService {

    // ============================================================
    //  HELPER: DISTANCE (HAVERSINE)
    // ============================================================
    private calculateDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ) {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // ============================================================
    //  HELPER: SCORING FUNCTION
    // ============================================================
    private scoreExec(exec: Exec, req: Request, sameTaluka: boolean) {

        const loadRatio = exec.current_load / exec.capacity;

        let distance = 50; // default high distance
        if (exec.latitude && exec.longitude && req.latitude && req.longitude) {
            distance = this.calculateDistance(
                exec.latitude,
                exec.longitude,
                req.latitude,
                req.longitude
            );
        }

        const sameTalukaBonus = sameTaluka ? 1 : 0;
        const priorityBonus = req.priority === "HIGH" ? 1 : 0;

        const score =
            (distance * 0.4) +
            (loadRatio * 10 * 0.3) -
            (sameTalukaBonus * 5 * 0.2) -
            (priorityBonus * 5 * 0.1);

        return score;
    }

    // ============================================================
    //  SMART ASSIGN V2 (🔥 MAIN ENGINE)
    // ============================================================
    async smartAssign(taluka: string, managerId: string) {
        return withTransaction(async (tx) => {

            // =============================
            // 1. GET REQUESTS WITH LOCATION
            // =============================
            const reqRes = await tx.query(`
        SELECT vr.id, vr.lead_id, vr.priority,
               l.latitude, l.longitude, l.taluka
        FROM visit_requests vr
        JOIN leads l ON vr.lead_id = l.id
        WHERE vr.status = 'PENDING'
          AND l.taluka = $1
        FOR UPDATE
      `, [taluka]);

            const requests: Request[] = reqRes.rows;
            if (!requests.length) return [];

            // =============================
            // 2. GET EXECUTIVES WITH LOCATION
            // =============================
            const execRes = await tx.query(`
        SELECT 
          u.id,
          u.name,
          u.capacity,
          u.latitude,
          u.longitude,
          COALESCE(v.visit_count, 0) as current_load
        FROM users u
        LEFT JOIN (
          SELECT field_exec_id, COUNT(*) as visit_count
          FROM visits
          WHERE status IN ('SCHEDULED', 'IN_PROGRESS')
          GROUP BY field_exec_id
        ) v ON v.field_exec_id = u.id
        WHERE u.role = 'FIELD_EXEC'
          AND u.is_active = true
      `);

            const execs: Exec[] = execRes.rows;

            const assignments: any[] = [];

            // =============================
            // 3. ASSIGN EACH REQUEST
            // =============================
            for (const req of requests) {

                // Filter only available execs
                const availableExecs = execs.filter(
                    e => e.current_load < e.capacity
                );

                if (!availableExecs.length) {
                    assignments.push({
                        requestId: req.id,
                        assignedTo: "QUEUE"
                    });
                    continue;
                }

                // =============================
                // 4. SCORE ALL EXECS
                // =============================
                const scored = availableExecs.map(exec => {
                    const sameTaluka = true; // currently same taluka filter
                    const score = this.scoreExec(exec, req, sameTaluka);
                    return { exec, score };
                });

                // =============================
                // 5. PICK BEST EXEC
                // =============================
                scored.sort((a, b) => a.score - b.score);
                const best = scored[0].exec;

                // =============================
                // 6. DB OPERATIONS
                // =============================
                await tx.query(`
          UPDATE visit_requests
          SET status = 'ASSIGNED',
              assigned_to = $1,
              assigned_at = NOW()
          WHERE id = $2
        `, [best.id, req.id]);

                await tx.query(`
          INSERT INTO visits
          (visit_request_id, lead_id, field_exec_id, status)
          VALUES ($1, $2, $3, 'SCHEDULED')
        `, [req.id, req.lead_id, best.id]);

                // Update local load
                best.current_load++;

                assignments.push({
                    requestId: req.id,
                    assignedTo: best.name
                });
            }

            return assignments;
        });
    }

    // ============================================================
    //  KEEP OTHER FUNCTIONS SAME
    // ============================================================

    async getMapData() {
        return withTransaction(async (tx) => {
            const res = await tx.query(`
        SELECT 
          l.taluka,
          COUNT(*) as total_requests
        FROM visit_requests vr
        JOIN leads l ON vr.lead_id = l.id
        WHERE vr.status = 'PENDING'
        GROUP BY l.taluka
        ORDER BY total_requests DESC
      `);
            return res.rows;
        });
    }

    async getTalukaDetails(taluka: string) {
        return withTransaction(async (tx) => {

            const requests = await tx.query(`
        SELECT vr.id, vr.lead_id, vr.priority, vr.created_at,
               l.farmer_name, l.phone_number, l.latitude, l.longitude
        FROM visit_requests vr
        JOIN leads l ON vr.lead_id = l.id
        WHERE vr.status = 'PENDING'
          AND l.taluka = $1
      `, [taluka]);

            const execs = await tx.query(`
        SELECT 
          u.id,
          u.name,
          u.phone,
          u.latitude,
          u.longitude,
          COALESCE(v.visit_count, 0) as current_load,
          u.capacity
        FROM users u
        LEFT JOIN (
          SELECT field_exec_id, COUNT(*) as visit_count
          FROM visits
          WHERE status IN ('SCHEDULED', 'IN_PROGRESS')
          GROUP BY field_exec_id
        ) v ON v.field_exec_id = u.id
        WHERE u.role = 'FIELD_EXEC'
          AND u.is_active = true
      `);

            return {
                requests: requests.rows,
                fieldExecutives: execs.rows
            };
        });
    }

    async bulkAssign(assignments: { requestId: string; execId: string }[], managerId: string) {
        return withTransaction(async (tx) => {
            for (const a of assignments) {
                await tx.query(`
          UPDATE visit_requests
          SET status = 'ASSIGNED',
              assigned_to = $1,
              assigned_at = NOW()
          WHERE id = $2
        `, [a.execId, a.requestId]);

                await tx.query(`
          INSERT INTO visits
          (visit_request_id, lead_id, field_exec_id, status)
          SELECT id, lead_id, $1, 'SCHEDULED'
          FROM visit_requests
          WHERE id = $2
        `, [a.execId, a.requestId]);
            }
            return { success: true };
        });
    }

    
    // ============================================================
    // SUGGESTION ENGINE 
    // ============================================================
    // ============================================================
    // SUGGESTION ENGINE  (FIXED)
    // ============================================================
    async getAssignmentSuggestions(taluka: string) {
        return withTransaction(async (tx) => {

            // ============================================================
            // 1. GET PENDING REQUESTS
            // ============================================================
            const requestsRes = await tx.query(
                `
      SELECT vr.id
      FROM visit_requests vr
      JOIN leads l ON l.id = vr.lead_id
      WHERE vr.status = 'PENDING'
        AND l.taluka = $1
      `,
                [taluka]
            );

            const totalRequests = requestsRes.rows.length;

            if (totalRequests === 0) {
                return {
                    suggestions: [],
                    unassigned: 0,
                    message: "No pending requests"
                };
            }

            // ============================================================
            // 2. GET FIELD EXECUTIVES
            // ============================================================
            const execRes = await tx.query(
                `
      SELECT 
        u.id,
        u.name,
        u.phone,
        u.taluka,
        COALESCE(v.count, 0) as current_load,
        COALESCE(u.capacity, 10) as capacity
      FROM users u
      LEFT JOIN (
        SELECT field_exec_id, COUNT(*) as count
        FROM visits
        WHERE status IN ('ASSIGNED', 'IN_PROGRESS')
        GROUP BY field_exec_id
      ) v ON v.field_exec_id = u.id
      WHERE u.role = 'FIELD_EXEC'
        AND u.is_active = true
      `
            );

            let execs = execRes.rows;

            // ============================================================
            // 3. CALCULATE REMAINING CAPACITY
            // ============================================================
            execs = execs.map((e: any) => ({
                ...e,
                remaining: e.capacity - e.current_load,
                sameTaluka: e.taluka === taluka
            }));

            // ============================================================
            // 4. SORT (SMART PRIORITY)
            // ============================================================
            execs.sort((a: any, b: any) => {
                // Same taluka first
                if (a.sameTaluka !== b.sameTaluka) {
                    return b.sameTaluka - a.sameTaluka;
                }
                // Higher capacity next
                return b.remaining - a.remaining;
            });

            // ============================================================
            // 5. DISTRIBUTION ENGINE
            // ============================================================
            let remainingRequests = totalRequests;
            const suggestions: any[] = [];

            for (const exec of execs) {
                if (remainingRequests <= 0) break;
                if (exec.remaining <= 0) continue;

                const assignCount = Math.min(exec.remaining, remainingRequests);

                suggestions.push({
                    execId: exec.id,
                    name: exec.name,
                    assignCount,
                    currentLoad: exec.current_load,
                    capacity: exec.capacity,
                    reason: exec.sameTaluka
                        ? "Same taluka → low travel time"
                        : "Available capacity"
                });

                remainingRequests -= assignCount;
            }

            // ============================================================
            // 6. FINAL RESPONSE
            // ============================================================
            return {
                totalRequests,
                suggestions,
                unassigned: remainingRequests,
                message:
                    remainingRequests > 0
                        ? `${remainingRequests} visits should be scheduled for tomorrow`
                        : "All visits can be assigned today"
            };

        });
    }

    // ============================================================
// COMPLETED VISITS (TODAY)
// ============================================================
async getCompletedVisitsToday() {
  return withTransaction(async (tx) => {
    const res = await tx.query(`
      SELECT 
        l.farmer_name,
        v.outcome,
        v.visit_notes
      FROM visits v
      JOIN leads l ON v.lead_id = l.id
      WHERE v.status = 'COMPLETED'
        AND DATE(v.completed_at) = CURRENT_DATE
      ORDER BY v.completed_at DESC
    `);

    return res.rows;
  });
}

// ============================================================
// REASSIGN VISIT
// ============================================================
async reassignVisit(requestId: string, newExecId: string, managerId: string) {
  return withTransaction(async (tx) => {

    // 1. GET CURRENT VISIT
    const visitRes = await tx.query(`
      SELECT id, lead_id
      FROM visits
      WHERE visit_request_id = $1
    `, [requestId]);

    if (!visitRes.rows.length) {
      throw new Error("Visit not found");
    }

    const visit = visitRes.rows[0];

    // 2. UPDATE VISIT
    await tx.query(`
      UPDATE visits
      SET field_exec_id = $1
      WHERE id = $2
    `, [newExecId, visit.id]);

    // 3. UPDATE REQUEST
    await tx.query(`
      UPDATE visit_requests
      SET assigned_to = $1,
          assigned_at = NOW()
      WHERE id = $2
    `, [newExecId, requestId]);

    return { success: true };
  });
}

// ============================================================
// ETA CALCULATION (🔥 SIMPLE + REALISTIC)
// ============================================================
private estimateETA(distanceKm: number) {
  const avgSpeed = 30; // km/h (rural realistic)
  const hours = distanceKm / avgSpeed;
  return Math.round(hours * 60); // minutes
}

// ============================================================
// TEAM STATUS (UPGRADED WITH ETA)
// ============================================================
async getTeamStatus() {
  return withTransaction(async (tx) => {

    const res = await tx.query(`
      SELECT 
        u.id,
        u.name,
        u.latitude,
        u.longitude,
        COUNT(v.id) as total_visits,
        COUNT(*) FILTER (WHERE v.status = 'IN_PROGRESS') as in_progress,
        MAX(l.latitude) as target_lat,
        MAX(l.longitude) as target_lng
      FROM users u
      LEFT JOIN visits v ON v.field_exec_id = u.id
      LEFT JOIN leads l ON v.lead_id = l.id
      WHERE u.role = 'FIELD_EXEC'
      GROUP BY u.id, u.name, u.latitude, u.longitude
    `);

    const data = res.rows.map((r: any) => {

      let eta = null;

      if (
        r.latitude &&
        r.longitude &&
        r.target_lat &&
        r.target_lng
      ) {
        const dist = this.calculateDistance(
          r.latitude,
          r.longitude,
          r.target_lat,
          r.target_lng
        );

        eta = this.estimateETA(dist);
      }

      return {
        name: r.name,
        total_visits: Number(r.total_visits),
        in_progress: Number(r.in_progress),
        eta: eta ? `${eta} min` : "N/A"
      };
    });

    return data;
  });
}

}
