import type { RowDataPacket } from "mysql2";
import { pool } from "../../../db/pool.js";

/** Pass a parameterized SQL with exactly one `?` for the slug value. */
export async function nextUniqueSlug(
  checkSql: string,
  baseSlug: string
): Promise<string> {
  let s = baseSlug;
  let n = 0;
  while (true) {
    const [rows] = await pool.query<RowDataPacket[]>(checkSql, [s]);
    if (!rows.length) return s;
    n += 1;
    s = `${baseSlug}-${n}`;
  }
}
