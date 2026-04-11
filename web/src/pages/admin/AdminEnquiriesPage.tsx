import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  adminApiGet,
  adminApiPatch,
  adminApiPost,
  adminDownloadCsv,
} from "@/lib/adminApi";

type EnquiryRow = {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  destination: string | null;
  requirement: string | null;
  status: string;
  created_at: string;
};

type EnquiryDetail = {
  id: number;
  tripType: string | null;
  lookingFor: string | null;
  destination: string | null;
  days: string | null;
  budget: string | null;
  hotelStay: string | null;
  hotelType: string | null;
  flightTrain: string | null;
  cab: string | null;
  transport: string | null;
  fullName: string;
  phone: string;
  email: string;
  requirement: string | null;
  startingDate: string | null;
  returningDate: string | null;
  person: string | null;
  children: string | null;
  ip_address: string | null;
  created_at: string;
  status: string;
  updated_at: string | null;
  last_auto_save: string | null;
  session_id: string | null;
  converted_to_lead: number | null;
};

type ListResponse = {
  data: EnquiryRow[];
  meta: { total: number; limit: number; offset: number };
};

const STATUSES = ["partial", "complete", "converted", "archived"] as const;

const DETAIL_ROWS: { key: keyof EnquiryDetail; label: string }[] = [
  { key: "tripType", label: "Trip type" },
  { key: "lookingFor", label: "Looking for" },
  { key: "destination", label: "Destination" },
  { key: "days", label: "Days" },
  { key: "budget", label: "Budget" },
  { key: "hotelStay", label: "Hotel stay" },
  { key: "hotelType", label: "Hotel type" },
  { key: "flightTrain", label: "Flight / train" },
  { key: "cab", label: "Cab" },
  { key: "transport", label: "Transport" },
  { key: "startingDate", label: "Starting date" },
  { key: "returningDate", label: "Returning date" },
  { key: "person", label: "Adults / persons" },
  { key: "children", label: "Children" },
  { key: "ip_address", label: "IP address" },
  { key: "session_id", label: "Session ID" },
  { key: "last_auto_save", label: "Last auto-save" },
  { key: "updated_at", label: "Updated at" },
  { key: "converted_to_lead", label: "Converted to lead (id)" },
];

function formatVal(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v).trim();
  return s;
}

export function AdminEnquiriesPage() {
  const [rows, setRows] = useState<EnquiryRow[]>([]);
  const [meta, setMeta] = useState<{
    total: number;
    limit: number;
    offset: number;
  } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [patchingId, setPatchingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<EnquiryDetail | null>(null);
  const [detailErr, setDetailErr] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [convertBusy, setConvertBusy] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams({ limit: "40", offset: "0" });
    if (filterStatus) q.set("status", filterStatus);
    adminApiGet<ListResponse>(`/api/admin/enquiries?${q}`)
      .then((r) => {
        setRows(r.data);
        setMeta(r.meta);
        setErr(null);
      })
      .catch((e) => {
        setErr(e instanceof Error ? e.message : "Failed to load");
        setRows([]);
      });
  }, [filterStatus]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      setDetailErr(null);
      return;
    }
    setDetailLoading(true);
    setDetailErr(null);
    adminApiGet<{ data: EnquiryDetail }>(`/api/admin/enquiries/${selectedId}`)
      .then((r) => {
        setDetail(r.data);
        setDetailErr(null);
      })
      .catch((e) => {
        setDetail(null);
        setDetailErr(e instanceof Error ? e.message : "Failed to load detail");
      })
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function onExportCsv() {
    try {
      await adminDownloadCsv("/api/admin/enquiries/export.csv", "enquiries-export.csv");
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Export failed");
    }
  }

  async function convertToLead(enquiryId: number) {
    setConvertBusy(true);
    setErr(null);
    try {
      const r = await adminApiPost<{
        data: { leadId: number; lead_code?: string; alreadyConverted?: boolean };
      }>(`/api/admin/enquiries/${enquiryId}/convert-to-lead`, {});
      const leadId = r.data.leadId;
      setDetail((d) =>
        d && d.id === enquiryId
          ? { ...d, converted_to_lead: leadId, status: "converted" }
          : d
      );
      setRows((prev) =>
        prev.map((row) =>
          row.id === enquiryId
            ? { ...row, status: "converted" }
            : row
        )
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Convert failed");
    } finally {
      setConvertBusy(false);
    }
  }

  async function updateRowStatus(id: number, next: string) {
    setPatchingId(id);
    try {
      await adminApiPatch<{ ok: boolean }>(`/api/admin/enquiries/${id}`, {
        status: next,
      });
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: next } : r))
      );
      setDetail((d) => (d && d.id === id ? { ...d, status: next } : d));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    } finally {
      setPatchingId(null);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800">Enquiries</h2>
      <p className="mt-1 text-slate-600">
        Rows from <code className="text-xs">contactform</code>
        {meta ? ` · ${meta.total} total` : null}. Click a row for full detail.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void onExportCsv()}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Export CSV
        </button>
        <label className="text-sm text-slate-600">Filter</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {err ? (
        <p className="mt-4 text-sm text-rose-600">{err}</p>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 font-semibold">ID</th>
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold">Contact</th>
              <th className="px-3 py-2 font-semibold">Destination</th>
              <th className="px-3 py-2 font-semibold">Requirement</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={`cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 ${
                  selectedId === r.id ? "bg-admin-accent/5" : ""
                }`}
              >
                <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
                <td className="px-3 py-2 font-medium text-slate-800">
                  {r.fullName}
                </td>
                <td className="max-w-[200px] px-3 py-2 text-slate-600">
                  <div className="truncate">{r.email}</div>
                  <div className="truncate text-xs">{r.phone}</div>
                </td>
                <td className="max-w-[120px] truncate px-3 py-2 text-slate-600">
                  {r.destination || "—"}
                </td>
                <td className="max-w-[200px] truncate px-3 py-2 text-xs text-slate-500">
                  {r.requirement || "—"}
                </td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={
                      STATUSES.includes(r.status as (typeof STATUSES)[number])
                        ? r.status
                        : "partial"
                    }
                    disabled={patchingId === r.id}
                    onChange={(e) => void updateRowStatus(r.id, e.target.value)}
                    className="rounded border border-slate-200 bg-white px-2 py-1 text-xs capitalize"
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

      {rows.length === 0 && !err ? (
        <p className="mt-8 text-center text-slate-500">No enquiries.</p>
      ) : null}

      {selectedId !== null ? (
        <>
          <button
            type="button"
            aria-label="Close detail"
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setSelectedId(null)}
          />
          <aside className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Enquiry #{selectedId}
                </p>
                {detail ? (
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">
                    {detail.fullName}
                  </h3>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {detailLoading ? (
                <p className="text-sm text-slate-500">Loading…</p>
              ) : null}
              {detailErr ? (
                <p className="text-sm text-rose-600">{detailErr}</p>
              ) : null}
              {detail ? (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {detail.converted_to_lead ? (
                      <Link
                        to={`/admin/leads/${detail.converted_to_lead}`}
                        className="inline-flex items-center rounded-lg bg-admin-accent px-3 py-2 text-sm font-medium text-white hover:bg-admin-accent-hover"
                      >
                        Open lead #{detail.converted_to_lead}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={convertBusy}
                        onClick={() => void convertToLead(detail.id)}
                        className="rounded-lg border border-admin-accent bg-admin-accent/10 px-3 py-2 text-sm font-medium text-admin-accent hover:bg-admin-accent/15 disabled:opacity-50"
                      >
                        {convertBusy ? "Converting…" : "Convert to lead"}
                      </button>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500">Status</p>
                    <select
                      value={
                        STATUSES.includes(
                          detail.status as (typeof STATUSES)[number]
                        )
                          ? detail.status
                          : "partial"
                      }
                      disabled={patchingId === detail.id}
                      onChange={(e) =>
                        void updateRowStatus(detail.id, e.target.value)
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm capitalize"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500">Email</p>
                    <a
                      href={`mailto:${detail.email}`}
                      className="text-sm text-admin-accent hover:underline"
                    >
                      {detail.email}
                    </a>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Phone</p>
                    <a
                      href={`tel:${detail.phone}`}
                      className="text-sm text-slate-800"
                    >
                      {detail.phone}
                    </a>
                  </div>

                  {formatVal(detail.requirement) ? (
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Requirement / notes
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                        {detail.requirement}
                      </p>
                    </div>
                  ) : null}

                  <dl className="space-y-3 border-t border-slate-100 pt-4">
                    <div>
                      <dt className="text-xs text-slate-500">Created</dt>
                      <dd className="text-sm text-slate-800">
                        {detail.created_at}
                      </dd>
                    </div>
                    {DETAIL_ROWS.map(({ key, label }) => {
                      const raw = detail[key];
                      const text = formatVal(
                        typeof raw === "number" ? String(raw) : raw
                      );
                      if (!text) return null;
                      return (
                        <div key={key}>
                          <dt className="text-xs text-slate-500">{label}</dt>
                          <dd className="text-sm text-slate-800">{text}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              ) : null}
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
