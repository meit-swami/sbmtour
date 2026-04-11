import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminApiGet, adminApiPatch } from "@/lib/adminApi";

type Props = {
  title: string;
  apiBase: string;
  listPath: string;
};

export function AdminJsonEditPage({ title, apiBase, listPath }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    adminApiGet<{ data: Record<string, unknown> }>(`${apiBase}/${id}`)
      .then((r) => {
        const { id: _i, ...rest } = r.data;
        setText(JSON.stringify(rest, null, 2));
        setErr(null);
      })
      .catch((e) => {
        setErr(e instanceof Error ? e.message : "Load failed");
        setText("");
      })
      .finally(() => setLoading(false));
  }, [apiBase, id]);

  async function save() {
    setMsg(null);
    setErr(null);
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(text) as Record<string, unknown>;
    } catch {
      setErr("Invalid JSON");
      return;
    }
    delete body.id;
    try {
      await adminApiPatch(`${apiBase}/${id}`, body);
      setMsg("Saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  }

  if (!id) return null;

  return (
    <div>
      <Link
        to={listPath}
        className="text-sm font-medium text-admin-accent hover:underline"
      >
        ← {title}
      </Link>
      <h2 className="mt-4 text-2xl font-bold text-slate-800">
        Edit #{id} · {title}
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Advanced JSON editor — invalid JSON or wrong field types will fail the
        API. Prefer structured editors where available.
      </p>
      {loading ? (
        <p className="mt-6 text-slate-500">Loading…</p>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={22}
            className="mt-6 w-full max-w-3xl rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs"
          />
          {err ? <p className="mt-2 text-sm text-rose-600">{err}</p> : null}
          {msg ? <p className="mt-2 text-sm text-emerald-600">{msg}</p> : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void save()}
              className="rounded-lg bg-admin-accent px-4 py-2 text-sm font-medium text-white hover:bg-admin-accent-hover"
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={() => navigate(listPath)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
