import type { RowDataPacket } from "mysql2";
import type { Pool, PoolConnection } from "mysql2/promise";

export async function generateLeadCode(
  conn: Pool | PoolConnection
): Promise<string> {
  try {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT generate_lead_code() AS c"
    );
    const c = (rows[0] as { c?: string } | undefined)?.c;
    if (c && typeof c === "string") return c;
  } catch {
    /* MySQL function may be missing in some imports */
  }
  for (let i = 0; i < 25; i++) {
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const n = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    const code = `LEAD-${ymd}-${n}`;
    const [dup] = await conn.query<RowDataPacket[]>(
      "SELECT id FROM leads WHERE lead_code = ? LIMIT 1",
      [code]
    );
    if (!dup.length) return code;
  }
  throw new Error("Could not generate unique lead_code");
}
