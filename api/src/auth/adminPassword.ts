import { createHash } from "node:crypto";
import bcrypt from "bcrypt";
import { pool } from "../db/pool.js";

function md5Hex(s: string): string {
  return createHash("md5").update(s, "utf8").digest("hex");
}

export async function verifyAdminPassword(
  plain: string,
  stored: string
): Promise<boolean> {
  if (!stored) return false;
  if (stored.startsWith("$2")) {
    return bcrypt.compare(plain, stored);
  }
  if (/^[a-f0-9]{32}$/i.test(stored)) {
    return md5Hex(plain).toLowerCase() === stored.toLowerCase();
  }
  return false;
}

/** After a successful legacy MD5 login, store bcrypt for next time. */
export async function upgradeAdminPasswordIfLegacy(
  adminId: number,
  plain: string,
  stored: string
): Promise<void> {
  if (stored.startsWith("$2")) return;
  if (!/^[a-f0-9]{32}$/i.test(stored)) return;
  const hash = await bcrypt.hash(plain, 10);
  await pool.query(`UPDATE tbl_admin SET password = ? WHERE id = ?`, [
    hash,
    adminId,
  ]);
}
