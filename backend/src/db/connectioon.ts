import { Pool } from "pg"
import { env } from "../config/env"

const pool = new Pool({
  connectionString: env.DATABASE_URL,
})
//fixing the connections
export default pool
