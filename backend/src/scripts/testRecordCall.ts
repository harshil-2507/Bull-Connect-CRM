import crypto from 'crypto';
import { pool } from '../config/db';
import { recordCallLog } from '../services/callLog.service';

async function main() {
  const leadId = crypto.randomUUID();
  const userId = 'test-telecaller';

  // Create a minimal lead row (adjust if your schema requires more fields)
  await pool.query(
    `INSERT INTO leads (id, status, attempt_count, assigned_to, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())`,
    [leadId, 'ASSIGNED', 0, userId]
  );

  try {
    const res = await recordCallLog({
      leadId,
      userId,
      disposition: 'INTERESTED' as any,
      cropType: 'Wheat',
      acreage: 2,
    } as any);

    console.log('recordCallLog result:', res);

    const leadRow = await pool.query(
      'SELECT id, status, lead_status_v2, attempt_count FROM leads WHERE id = $1',
      [leadId]
    );
    console.log('Lead row:', leadRow.rows[0]);

    const history = await pool.query(
      'SELECT * FROM lead_status_history WHERE lead_id = $1 ORDER BY created_at DESC',
      [leadId]
    );
    console.log('lead_status_history rows:', history.rows);
  } catch (err) {
    console.error('Error during testRecordCall:', err);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
