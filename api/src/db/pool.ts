import mysql from "mysql2/promise";
import { config } from "../config.js";

function sslOption():
  | { rejectUnauthorized: boolean }
  | undefined {
  const v = (process.env.DB_SSL ?? "").toLowerCase();
  if (v !== "1" && v !== "true" && v !== "yes") return undefined;
  const strict =
    process.env.DB_SSL_STRICT === "1" ||
    process.env.DB_SSL_STRICT === "true";
  return strict ? { rejectUnauthorized: true } : { rejectUnauthorized: false };
}

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  ssl: sslOption(),
  /** Avoid BigInt in row objects — `res.json()` cannot serialize BigInt (500 on /api/home, etc.). */
  supportBigNumbers: true,
  bigNumberStrings: true,
});

export async function pingDb(): Promise<boolean> {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    return true;
  } catch {
    return false;
  }
}
