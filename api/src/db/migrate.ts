/**
 * Ordered SQL migrations from `api/migrations/*.sql`.
 * Run: `npm run migrate -w api` (from repo root) or `npm run migrate` in `api/`.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2";
import { config } from "../config.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "../../migrations");

async function ensureTrackingTable(
  conn: mysql.Connection
): Promise<void> {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_schema_migrations_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function appliedNames(conn: mysql.Connection): Promise<Set<string>> {
  const [rows] = await conn.query<RowDataPacket[]>(
    "SELECT name FROM schema_migrations ORDER BY id ASC"
  );
  return new Set(rows.map((r) => String(r.name)));
}

async function main(): Promise<void> {
  let files: string[];
  try {
    files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  } catch (e) {
    console.error(
      `[migrate] Cannot read ${MIGRATIONS_DIR}:`,
      e instanceof Error ? e.message : e
    );
    process.exit(1);
  }

  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    multipleStatements: true,
  });

  try {
    await ensureTrackingTable(conn);
    const done = await appliedNames(conn);

    let applied = 0;
    for (const file of files) {
      if (done.has(file)) continue;

      const path = join(MIGRATIONS_DIR, file);
      const sql = (await readFile(path, "utf8")).trim();
      if (!sql) {
        console.warn(`[migrate] skipping empty file: ${file}`);
        continue;
      }

      await conn.beginTransaction();
      try {
        await conn.query(sql);
        await conn.query("INSERT INTO schema_migrations (name) VALUES (?)", [
          file,
        ]);
        await conn.commit();
        console.log(`[migrate] applied ${file}`);
        applied += 1;
      } catch (e) {
        await conn.rollback();
        throw e;
      }
    }

    if (applied === 0) {
      console.log("[migrate] already up to date");
    }
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error("[migrate] failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
