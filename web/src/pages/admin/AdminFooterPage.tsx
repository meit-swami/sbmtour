import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApiGet, adminApiPatch, adminApiPost } from "@/lib/adminApi";

type Layout = {
  id: number;
  layout_name: string;
  layout_slug: string;
  active: number;
  status: number;
};

type Widget = {
  id: number;
  widget_type: string;
  widget_title: string | null;
  column_position: number;
  row_order: number;
  status: number;
};

export function AdminFooterPage() {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [layoutId, setLayoutId] = useState<number | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    adminApiGet<{ data: Layout[] }>("/api/admin/footer/layouts")
      .then((r) => {
        setLayouts(r.data);
        setLayoutId((prev) => prev ?? r.data[0]?.id ?? null);
        setErr(null);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed"));
  }, []);

  useEffect(() => {
    if (!layoutId) return;
    adminApiGet<{ data: Widget[] }>(
      `/api/admin/footer/layouts/${layoutId}/widgets`
    )
      .then((r) => setWidgets(r.data))
      .catch(() => setWidgets([]));
  }, [layoutId]);

  async function moveWidget(widgetId: number, direction: "up" | "down") {
    setErr(null);
    try {
      await adminApiPost(
        `/api/admin/footer/widgets/${widgetId}/move-sibling`,
        { direction }
      );
      if (layoutId) {
        const r = await adminApiGet<{ data: Widget[] }>(
          `/api/admin/footer/layouts/${layoutId}/widgets`
        );
        setWidgets(r.data);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Reorder failed");
    }
  }

  async function activateLayout(id: number) {
    setBusy(id);
    setErr(null);
    try {
      await adminApiPatch(`/api/admin/footer/layouts/${id}`, { active: 1 });
      setLayouts((prev) =>
        prev.map((l) => ({ ...l, active: l.id === id ? 1 : 0 }))
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800">Footer builder</h2>
      <p className="mt-1 text-sm text-slate-600">
        “Set live” updates <code className="text-xs">active_footer_id</code> in{" "}
        <code className="text-xs">tbl_web_settings</code> and clears other layouts’
        active flag. Public site uses <code className="text-xs">GET /api/footer</code>.
      </p>
      {err ? <p className="mt-4 text-sm text-rose-600">{err}</p> : null}

      <div className="mt-6 space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-800">Layouts</h3>
        <ul className="space-y-2 text-sm">
          {layouts.map((l) => (
            <li
              key={l.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-2 last:border-0"
            >
              <span>
                {l.layout_name}{" "}
                {l.active ? (
                  <span className="text-emerald-600">· active</span>
                ) : null}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy === l.id || !!l.active}
                  onClick={() => void activateLayout(l.id)}
                  className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-40"
                >
                  Set live
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutId(l.id)}
                  className={`rounded px-2 py-1 text-xs ${
                    layoutId === l.id
                      ? "bg-admin-accent/15 text-admin-accent"
                      : "border border-slate-200"
                  }`}
                >
                  Widgets
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {layoutId ? (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-slate-800">
            Widgets (layout #{layoutId})
          </h3>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Col</th>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">On</th>
                  <th className="px-3 py-2">Move</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {widgets.map((w) => (
                  <tr key={w.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-mono text-xs">{w.id}</td>
                    <td className="px-3 py-2 text-xs">{w.widget_type}</td>
                    <td className="max-w-[180px] truncate px-3 py-2">
                      {w.widget_title ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">{w.column_position}</td>
                    <td className="px-3 py-2 text-xs">{w.row_order}</td>
                    <td className="px-3 py-2 text-xs">
                      {w.status ? "yes" : "no"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          title="Move up in column"
                          onClick={() => void moveWidget(w.id, "up")}
                          className="rounded border border-slate-200 px-1.5 py-0.5 hover:bg-slate-50"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          title="Move down in column"
                          onClick={() => void moveWidget(w.id, "down")}
                          className="rounded border border-slate-200 px-1.5 py-0.5 hover:bg-slate-50"
                        >
                          ↓
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        to={`/admin/footer/widgets/${w.id}`}
                        className="text-admin-accent hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
