/**
 * Centralized environment config
 * Keeps DB & server config in one place
 */
export const env = {
  PORT: Number(process.env.PORT || 3000),

  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: Number(process.env.DB_PORT || 15432),
  DB_USER: process.env.DB_USER || "bull_admin",
  DB_PASSWORD: process.env.DB_PASSWORD || "bull_secret",
  DB_NAME: process.env.DB_NAME || "bull_connect",
};