import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApiGet, adminDownloadCsv } from "@/lib/adminApi";

type Row = {
  id: number;
  lead_code: string;
  full_name: string;
  email: string;
  phone: string;
  destination: string | null;
  status: string;
  priority: string;
  source: string | null;
  assigned_to: number | null;
  created_at: string;
};

const STATUSES = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
  "on_hold",
] as const;

const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

const PAGE_SIZE = 50;

export function AdminLeadsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState<{
    total: number;
    limit: number;
    offset: number;
  } | null>(null);
  const [filter, setFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchInput.trim()), 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(0);
  }, [filter, priorityFilter, debouncedQ]);

  const offset = page * PAGE_SIZE;

  useEffect(() => {
    const q = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    if (filter) q.set("status", filter);
    if (priorityFilter) q.set("priority", priorityFilter);
    if (debouncedQ) q.set("q", debouncedQ);

    adminApiGet<{ data: Row[]; meta: { total: number; limit: number; offset: number } }>(
      `/api/admin/leads?${q}`
    )
      .then((r) => {
        setRows(r.data);
        setMeta({
          total: r.meta.total,
          limit: r.meta.limit,
          offset: r.meta.offset,
        });
        setErr(null);
      })
      .catch((e) => {
        setErr(e instanceof Error ? e.message : "Failed");
        setRows([]);
      });
  }, [filter, priorityFilter, debouncedQ, offset]);

  const totalPages =
    meta && meta.total > 0 ? Math.ceil(meta.total / PAGE_SIZE) : 0;
  const canPrev = page > 0;
  const canNext = totalPages > 0 && page < totalPages - 1;

  function exportHref(): string {
    const q = new URLSearchParams();
    if (filter) q.set("status", filter);
    if (priorityFilter) q.set("priority", priorityFilter);
    if (debouncedQ) q.set("q", debouncedQ);
    const qs = q.toString();
    return `/api/admin/leads/export.csv${qs ? `?${qs}` : ""}`;
  }

  async function onExport() {
    try {
      await adminDownloadCsv(exportHref(), "leads-export.csv");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Export failed");
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800">Leads (CRM)</h2>
      <p className="mt-1 text-sm text-slate-600">
        Pipeline from <code className="text-xs">leads</code> — open a row for
        status, priority, notes, assignment.
        {meta ? ` · ${meta.total} matching` : null}
      </p>
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
        <button
          type="button"
          onClick={() => void onExport()}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Export CSV
        </button>
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Search
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Name, email, phone, code, destination…"
            className="w-full min-w-[200px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm lg:max-w-md"
          />
        </label>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Status
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Priority
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {totalPages > 1 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
      {err ? <p className="mt-4 text-sm text-rose-600">{err}</p> : null}
      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">Destination</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Assigned</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="px-3 py-2 font-mono text-xs">{r.lead_code}</td>
                <td className="px-3 py-2 font-medium text-slate-800">
                  {r.full_name}
                </td>
                <td className="max-w-[180px] px-3 py-2 text-xs">
                  <div className="truncate">{r.email}</div>
                  <div className="text-slate-500">{r.phone}</div>
                </td>
                <td className="max-w-[120px] truncate px-3 py-2 text-xs">
                  {r.destination ?? "—"}
                </td>
                <td className="px-3 py-2 text-xs capitalize">
                  {r.status.replace(/_/g, " ")}
                </td>
                <td className="px-3 py-2 text-xs">{r.priority}</td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {r.assigned_to != null ? `#${r.assigned_to}` : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">
                  {r.created_at}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    to={`/admin/leads/${r.id}`}
                    className="text-admin-accent hover:underline"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
