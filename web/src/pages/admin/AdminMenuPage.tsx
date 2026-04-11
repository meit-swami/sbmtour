import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApiGet, adminApiPatch, adminApiPost } from "@/lib/adminApi";

type Location = {
  id: number;
  location_name: string;
  location_slug: string;
  active: number;
  status: number;
};

type MenuItem = {
  id: number;
  parent_id: number;
  item_type: string;
  item_title: string;
  item_url: string | null;
  menu_order: number;
  depth: number;
  target: string;
  status: number;
};

export function AdminMenuPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [locId, setLocId] = useState<number | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    adminApiGet<{ data: Location[] }>("/api/admin/menu/locations")
      .then((r) => {
        setLocations(r.data);
        setLocId((prev) => prev ?? r.data[0]?.id ?? null);
        setErr(null);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed"));
  }, []);

  useEffect(() => {
    if (!locId) return;
    adminApiGet<{ data: MenuItem[] }>(
      `/api/admin/menu/locations/${locId}/items`
    )
      .then((r) => setItems(r.data))
      .catch(() => setItems([]));
  }, [locId]);

  async function moveItem(itemId: number, direction: "up" | "down") {
    setErr(null);
    try {
      await adminApiPost(`/api/admin/menu/items/${itemId}/move-sibling`, {
        direction,
      });
      if (locId) {
        const r = await adminApiGet<{ data: MenuItem[] }>(
          `/api/admin/menu/locations/${locId}/items`
        );
        setItems(r.data);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Reorder failed");
    }
  }

  async function activateLocation(id: number) {
    setBusy(id);
    setErr(null);
    try {
      await adminApiPatch(`/api/admin/menu/locations/${id}`, { active: 1 });
      setLocations((prev) =>
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
      <h2 className="text-2xl font-bold text-slate-800">Menu builder</h2>
      <p className="mt-1 text-sm text-slate-600">
        Activating a location sets <code className="text-xs">tbl_web_settings</code>{" "}
        <code className="text-xs">active_menu_id</code> and turns off other locations.
        The React site reads the tree via <code className="text-xs">GET /api/menu</code>.
      </p>
      {err ? <p className="mt-4 text-sm text-rose-600">{err}</p> : null}

      <div className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-slate-800">Locations</h3>
        <ul className="space-y-2 text-sm">
          {locations.map((l) => (
            <li
              key={l.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-2 last:border-0"
            >
              <span>
                {l.location_name}{" "}
                {l.active ? (
                  <span className="text-emerald-600">· active</span>
                ) : null}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy === l.id || !!l.active}
                  onClick={() => void activateLocation(l.id)}
                  className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-40"
                >
                  Set live
                </button>
                <button
                  type="button"
                  onClick={() => setLocId(l.id)}
                  className={`rounded px-2 py-1 text-xs ${
                    locId === l.id
                      ? "bg-admin-accent/15 text-admin-accent"
                      : "border border-slate-200"
                  }`}
                >
                  Edit items
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {locId ? (
        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-800">
              Items (location #{locId})
            </h3>
            <Link
              to={`/admin/menu/items/new?locationId=${locId}`}
              className="rounded-lg bg-admin-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-admin-accent-hover"
            >
              New item
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">URL</th>
                  <th className="px-3 py-2">Parent</th>
                  <th className="px-3 py-2">Sort</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">On</th>
                  <th className="px-3 py-2">Move</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b border-slate-100">
                    <td className="px-3 py-2 font-mono text-xs">{it.id}</td>
                    <td className="max-w-[160px] truncate px-3 py-2">
                      {it.item_title}
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2 text-xs text-slate-500">
                      {it.item_url ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">{it.parent_id}</td>
                    <td className="px-3 py-2 text-xs">{it.menu_order}</td>
                    <td className="px-3 py-2 text-xs">{it.item_type}</td>
                    <td className="px-3 py-2 text-xs">
                      {it.status ? "yes" : "no"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          title="Move up among siblings"
                          onClick={() => void moveItem(it.id, "up")}
                          className="rounded border border-slate-200 px-1.5 py-0.5 hover:bg-slate-50"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          title="Move down among siblings"
                          onClick={() => void moveItem(it.id, "down")}
                          className="rounded border border-slate-200 px-1.5 py-0.5 hover:bg-slate-50"
                        >
                          ↓
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        to={`/admin/menu/items/${it.id}`}
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
