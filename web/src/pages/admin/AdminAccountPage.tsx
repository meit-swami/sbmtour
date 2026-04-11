import { useState, type FormEvent } from "react";
import { adminApiPost, setAdminToken } from "@/lib/adminApi";

export function AdminAccountPage() {
  const [current, setCurrent] = useState("");
  const [next1, setNext1] = useState("");
  const [next2, setNext2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (next1 !== next2) {
      setErr("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await adminApiPost("/api/admin/auth/change-password", {
        current_password: current,
        new_password: next1,
      });
      setMsg("Password updated. Please log in again with your new password.");
      setCurrent("");
      setNext1("");
      setNext2("");
      setAdminToken(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800">Account</h2>
      <p className="mt-1 text-sm text-slate-600">
        Change your admin password (bcrypt). You will be signed out after a
        successful change.
      </p>
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="mt-8 max-w-md space-y-4"
      >
        <label className="block text-sm text-slate-700">
          Current password
          <input
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm text-slate-700">
          New password
          <input
            type="password"
            autoComplete="new-password"
            value={next1}
            onChange={(e) => setNext1(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm text-slate-700">
          Confirm new password
          <input
            type="password"
            autoComplete="new-password"
            value={next2}
            onChange={(e) => setNext2(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
          />
        </label>
        {err ? <p className="text-sm text-rose-600">{err}</p> : null}
        {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-admin-accent px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {saving ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
