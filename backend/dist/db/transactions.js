"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTransaction = withTransaction;
const db_1 = require("../config/db");
/**
 * Runs a function inside a DB transaction.
 * Automatically handles BEGIN / COMMIT / ROLLBACK.
 */
async function withTransaction(fn) {
    const client = await db_1.pool.connect();
    try {
        await client.query("BEGIN");
        const result = await fn(client);
        await client.query("COMMIT");
        return result;
    }
    catch (err) {
        await client.query("ROLLBACK");
        throw err;
    }
    finally {
        client.release();
    }
}
