import { PoolClient } from "pg";
import { pool } from "./index";

/**
 * Executes a function inside a DB transaction
 * Guarantees atomic writes
 */
export async function withTransaction<T>(
  fn: (tx: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}