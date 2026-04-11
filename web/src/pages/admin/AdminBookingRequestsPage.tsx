import { useEffect, useState } from "react";
import { adminApiGet, adminApiPatch } from "@/lib/adminApi";

type Row = {
  id: number;
  booking_id: string;
  destination: string;
  customer_name: string | null;
  customer_email: string;
  customer_phone: string;
  departure_date: string | null;
  duration_days: number;
  status: string;
  created_at: string;
};

const STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "completed",
  "cancelled",
] as const;

export function AdminBookingRequestsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    adminApiGet<{ data: Row[] }>("/api/admin/booking-requests?limit=80")
      .then((r) => {
        setRows(r.data);
        setErr(null);
      })
      .catch((e) => {
        setErr(e instanceof Error ? e.message : "Failed");
        setRows([]);
      });
  }, []);

  async function setStatus(id: number, status: string) {
    setBusy(id);
    try {
      await adminApiPatch(`/api/admin/booking-requests/${id}`, { status });
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800">Booking requests</h2>
      <p className="mt-1 text-sm text-slate-600">
        <code className="text-xs">tbl_booking_requests</code> — from public plan
        trip form.
      </p>
      {err ? <p className="mt-4 text-sm text-rose-600">{err}</p> : null}
      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Booking ref</th>
              <th className="px-3 py-2">Destination</th>
              <th className="px-3 py-2">Guest</th>
              <th className="px-3 py-2">Dates</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.booking_id}</td>
                <td className="max-w-[140px] truncate px-3 py-2 text-xs">
                  {r.destination}
                </td>
                <td className="max-w-[160px] px-3 py-2 text-xs">
                  <div>{r.customer_name ?? "—"}</div>
                  <div className="truncate text-slate-500">{r.customer_email}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">
                  {r.departure_date ?? "—"} · {r.duration_days}d
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
                        {s}
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
