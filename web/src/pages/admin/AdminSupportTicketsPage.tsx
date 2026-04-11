import { useEffect, useState } from "react";
import { adminApiGet, adminApiPatch } from "@/lib/adminApi";

type Row = {
  id: number;
  user_name: string;
  user_email: string;
  user_phone: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

const STATUSES = ["new", "in_progress", "resolved", "archived"] as const;

export function AdminSupportTicketsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  function load() {
    adminApiGet<{ data: Row[] }>("/api/admin/support-tickets?limit=80")
      .then((r) => {
        setRows(r.data);
        setErr(null);
      })
      .catch((e) => {
        setErr(e instanceof Error ? e.message : "Failed");
        setRows([]);
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: number, status: string) {
    setBusy(id);
    try {
      await adminApiPatch(`/api/admin/support-tickets/${id}`, { status });
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800">Support tickets</h2>
      <p className="mt-1 text-sm text-slate-600">
        <code className="text-xs">contact_us_support</code>
      </p>
      {err ? <p className="mt-4 text-sm text-rose-600">{err}</p> : null}
      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Message</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
                <td className="max-w-[180px] px-3 py-2 text-xs">
                  <div className="font-medium">{r.user_name}</div>
                  <div className="truncate text-slate-500">{r.user_email}</div>
                </td>
                <td className="max-w-[220px] truncate px-3 py-2 text-xs text-slate-600">
                  {r.message ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={r.status}
                    disabled={busy === r.id}
                    onChange={(e) => void setStatus(r.id, e.target.value)}
                    className="rounded border border-slate-200 px-2 py-1 text-xs capitalize"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">
                  {r.created_at}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
