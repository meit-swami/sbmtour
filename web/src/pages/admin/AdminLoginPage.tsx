import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAdminToken, loginAdmin } from "@/lib/adminApi";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const loc = useLocation();
  const state = loc.state as { from?: string } | undefined;
  const from =
    state?.from &&
    state.from.startsWith("/admin") &&
    state.from !== "/admin/login"
      ? state.from
      : "/admin/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getAdminToken()) {
      navigate(from, { replace: true });
    }
  }, [navigate, from]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await loginAdmin(username.trim(), password);
      navigate(from, { replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 p-8 shadow-xl">
        <h1 className="text-center text-xl font-bold text-white">
          SBM <span className="text-admin-accent">CMS</span>
        </h1>
        <p className="mt-1 text-center text-sm text-slate-400">Admin sign in</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400">Username</label>
            <input
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-white"
            />
          </div>
          {err ? (
            <p className="text-sm text-rose-400">{err}</p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-admin-accent py-2.5 font-semibold text-white transition hover:bg-admin-accent-hover disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/" className="text-admin-accent hover:underline">
            ← Back to website
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-slate-600">
          Legacy MD5 passwords work once; the API upgrades them to bcrypt on login.
        </p>
      </div>
    </div>
  );
}
