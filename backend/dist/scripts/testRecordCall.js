"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../config/db");
const callLog_service_1 = require("../services/callLog.service");
async function main() {
    const leadId = crypto_1.default.randomUUID();
    const userId = 'test-telecaller';
    // Create a minimal lead row (adjust if your schema requires more fields)
    await db_1.pool.query(`INSERT INTO leads (id, status, attempt_count, assigned_to, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())`, [leadId, 'ASSIGNED', 0, userId]);
    try {
        const res = await (0, callLog_service_1.recordCallLog)({
            leadId,
            userId,
            disposition: 'INTERESTED',
            cropType: 'Wheat',
            acreage: 2,
        });
        console.log('recordCallLog result:', res);
        const leadRow = await db_1.pool.query('SELECT id, status, attempt_count FROM leads WHERE id = $1', [leadId]);
        console.log('Lead row:', leadRow.rows[0]);
        const history = await db_1.pool.query('SELECT * FROM lead_status_history WHERE lead_id = $1 ORDER BY created_at DESC', [leadId]);
        console.log('lead_status_history rows:', history.rows);
    }
    catch (err) {
        console.error('Error during testRecordCall:', err);
    }
    finally {
        await db_1.pool.end();
    }
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
