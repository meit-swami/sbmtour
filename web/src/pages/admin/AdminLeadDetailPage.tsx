import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  adminApiGet,
  adminApiPatch,
  adminApiPost,
} from "@/lib/adminApi";

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

const ACTIVITY_TYPES = [
  "call",
  "email",
  "meeting",
  "chat",
  "note",
  "proposal_sent",
  "follow_up",
] as const;

type AdminOpt = { id: number; username: string; email: string };

type ActivityRow = {
  id: number;
  activity_type: string;
  subject: string | null;
  description: string | null;
  activity_date: string;
  next_follow_up: string | null;
  status: string | null;
  created_by_username: string | null;
  created_at: string;
};

function toLocalInput(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminLeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [row, setRow] = useState<Record<string, string | number | null> | null>(
    null
  );
  const [admins, setAdmins] = useState<AdminOpt[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [notes, setNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actType, setActType] = useState<string>("note");
  const [actSubject, setActSubject] = useState("");
  const [actDesc, setActDesc] = useState("");
  const [actWhen, setActWhen] = useState("");
  const [actNext, setActNext] = useState("");
  const [actSaving, setActSaving] = useState(false);

  function loadActivities() {
    if (!id) return;
    adminApiGet<{ data: ActivityRow[] }>(`/api/admin/leads/${id}/activities`)
      .then((r) => setActivities(r.data))
      .catch(() => setActivities([]));
  }

  useEffect(() => {
    adminApiGet<{ data: AdminOpt[] }>("/api/admin/admin-users")
      .then((r) => setAdmins(r.data))
      .catch(() => setAdmins([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    adminApiGet<{ data: Record<string, string | number | null> }>(
      `/api/admin/leads/${id}`
    )
      .then((r) => {
        const d = r.data;
        setRow(d);
        setStatus(String(d.status ?? "new"));
        setPriority(String(d.priority ?? "medium"));
        setNotes(String(d.notes ?? ""));
        setAssignedTo(
          d.assigned_to != null && d.assigned_to !== ""
            ? String(d.assigned_to)
            : ""
        );
        setEstimatedValue(
          d.estimated_value != null && d.estimated_value !== ""
            ? String(d.estimated_value)
            : ""
        );
        setErr(null);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Load failed"));
    loadActivities();
    const now = new Date();
    setActWhen(toLocalInput(now.toISOString()));
  }, [id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const body: Record<string, unknown> = {
        status,
        priority,
        notes: notes.trim() || null,
      };
      const at = assignedTo.trim();
      if (at === "") body.assigned_to = null;
      else {
        const n = Number(at);
        if (!Number.isFinite(n) || n < 1) {
          setErr("Assignee must be selected or cleared.");
          setSaving(false);
          return;
        }
        body.assigned_to = n;
      }
      const ev = estimatedValue.trim();
      if (ev === "") body.estimated_value = null;
      else {
        const v = Number(ev);
        if (!Number.isFinite(v) || v < 0) {
          setErr("Estimated value must be a non-negative number or empty.");
          setSaving(false);
          return;
        }
        body.estimated_value = v;
      }
      await adminApiPatch(`/api/admin/leads/${id}`, body);
      setMsg("Saved.");
      loadActivities();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function addActivity(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setActSaving(true);
    setErr(null);
    try {
      const payload: Record<string, unknown> = {
        activity_type: actType,
        subject: actSubject.trim() || null,
        description: actDesc.trim() || null,
      };
      if (actWhen) {
        const d = new Date(actWhen);
        if (!Number.isNaN(d.getTime())) payload.activity_date = d.toISOString();
      }
      if (actNext) {
        const d = new Date(actNext);
        if (!Number.isNaN(d.getTime())) payload.next_follow_up = d.toISOString();
      }
      await adminApiPost(`/api/admin/leads/${id}/activities`, payload);
      setActSubject("");
      setActDesc("");
      loadActivities();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Activity save failed");
    } finally {
      setActSaving(false);
    }
  }

  if (err && !row) {
    return (
      <div>
        <Link to="/admin/leads" className="text-admin-accent hover:underline">
          ← Leads
        </Link>
        <p className="mt-6 text-rose-600">{err}</p>
      </div>
    );
  }

  if (!row) {
    return <p className="text-slate-500">{err ? err : "Loading…"}</p>;
  }

  return (
    <div>
      <Link
        to="/admin/leads"
        className="text-sm text-admin-accent hover:underline"
      >
        ← Leads
      </Link>
      <h2 className="mt-4 text-2xl font-bold text-slate-800">
        {String(row.lead_code ?? "Lead")} · #{id}
      </h2>

      <dl className="mt-6 grid max-w-2xl gap-3 text-sm md:grid-cols-2">
        <div>
          <dt className="text-slate-500">Name</dt>
          <dd className="font-medium">{String(row.full_name)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Email</dt>
          <dd>{String(row.email)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Phone</dt>
          <dd>{String(row.phone)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Destination</dt>
          <dd>{row.destination != null ? String(row.destination) : "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Source</dt>
          <dd>{row.source != null ? String(row.source) : "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Enquiry id</dt>
          <dd>
            {row.enquiry_id != null ? (
              <Link
                to="/admin/enquiries"
                className="text-admin-accent hover:underline"
              >
                {String(row.enquiry_id)}
              </Link>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div className="md:col-span-2">
          <dt className="text-slate-500">Special requirements</dt>
          <dd className="mt-1 whitespace-pre-wrap text-slate-700">
            {row.special_requirements != null
              ? String(row.special_requirements)
              : "—"}
          </dd>
        </div>
      </dl>

      <section className="mt-10 max-w-3xl border-t border-slate-200 pt-8">
        <h3 className="font-semibold text-slate-800">Activity log</h3>
        <ul className="mt-4 space-y-3 text-sm">
          {activities.length === 0 ? (
            <li className="text-slate-500">No activities yet.</li>
          ) : (
            activities.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium capitalize text-slate-800">
                    {a.activity_type.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-slate-500">
                    {a.activity_date}
                    {a.created_by_username
                      ? ` · ${a.created_by_username}`
                      : ""}
                  </span>
                </div>
                {a.subject ? (
                  <p className="mt-1 text-slate-700">{a.subject}</p>
                ) : null}
                {a.description ? (
                  <p className="mt-1 whitespace-pre-wrap text-slate-600">
                    {a.description}
                  </p>
                ) : null}
                {a.next_follow_up ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Follow-up: {a.next_follow_up}
                  </p>
                ) : null}
              </li>
            ))
          )}
        </ul>

        <form
          onSubmit={(e) => void addActivity(e)}
          className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <h4 className="text-sm font-medium text-slate-800">Add activity</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-slate-600">
              Type
              <select
                value={actType}
                onChange={(e) => setActType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-slate-600">
              When
              <input
                type="datetime-local"
                value={actWhen}
                onChange={(e) => setActWhen(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
              />
            </label>
          </div>
          <label className="block text-xs text-slate-600">
            Subject
            <input
              value={actSubject}
              onChange={(e) => setActSubject(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-slate-600">
            Description
            <textarea
              value={actDesc}
              onChange={(e) => setActDesc(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-slate-600">
            Next follow-up (optional)
            <input
              type="datetime-local"
              value={actNext}
              onChange={(e) => setActNext(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={actSaving}
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white disabled:opacity-60"
          >
            {actSaving ? "Adding…" : "Add activity"}
          </button>
        </form>
      </section>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="mt-10 max-w-xl space-y-4 border-t border-slate-200 pt-8"
      >
        <h3 className="font-semibold text-slate-800">Update pipeline</h3>
        <label className="block text-sm text-slate-700">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-slate-700">
          Priority
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-slate-700">
          Assigned to
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            <option value="">— Unassigned —</option>
            {admins.map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.username} (#{a.id})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-slate-700">
          Estimated value
          <input
            type="text"
            inputMode="decimal"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
            placeholder="Optional amount"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm text-slate-700">
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        {err ? <p className="text-sm text-rose-600">{err}</p> : null}
        {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-admin-accent px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
