import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { adminApiGet, adminApiPatch, adminApiPost } from "@/lib/adminApi";

const ITEM_TYPES = [
  "custom",
  "country",
  "destination",
  "package",
  "hotel",
  "vehicle",
  "page",
] as const;

export function AdminMenuItemEditPage() {
  const { id } = useParams<{ id: string }>();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const defaultLoc = Number(search.get("locationId")) || "";

  const [menu_location_id, setMenuLocationId] = useState<string | number>(
    defaultLoc
  );
  const [parent_id, setParentId] = useState("0");
  const [item_type, setItemType] = useState<string>("custom");
  const [item_id, setItemId] = useState("");
  const [item_title, setItemTitle] = useState("");
  const [item_url, setItemUrl] = useState("");
  const [menu_order, setMenuOrder] = useState("0");
  const [depth, setDepth] = useState("0");
  const [target, setTarget] = useState("_self");
  const [status, setStatus] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    const q = Number(search.get("locationId"));
    if (isNew && Number.isFinite(q) && q >= 1) {
      setMenuLocationId(String(q));
    }
  }, [isNew, search]);

  useEffect(() => {
    if (isNew || !id) return;
    setLoading(true);
    adminApiGet<{ data: Record<string, string | number | null> }>(
      `/api/admin/menu/items/${id}`
    )
      .then((r) => {
        const d = r.data;
        setMenuLocationId(String(d.menu_location_id ?? ""));
        setParentId(String(d.parent_id ?? 0));
        setItemType(String(d.item_type ?? "custom"));
        setItemId(d.item_id != null ? String(d.item_id) : "");
        setItemTitle(String(d.item_title ?? ""));
        setItemUrl(String(d.item_url ?? ""));
        setMenuOrder(String(d.menu_order ?? 0));
        setDepth(String(d.depth ?? 0));
        setTarget(String(d.target ?? "_self"));
        setStatus(Number(d.status) !== 0);
        setErr(null);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    const lid = Number(menu_location_id);
    if (!Number.isFinite(lid) || lid < 1) {
      setErr("Menu location required");
      return;
    }
    try {
      if (isNew) {
        await adminApiPost("/api/admin/menu/items", {
          menu_location_id: lid,
          parent_id: Number(parent_id) || 0,
          item_type,
          item_id: item_id.trim() ? Number(item_id) : null,
          item_title: item_title.trim(),
          item_url: item_url.trim() || null,
          menu_order: Number(menu_order) || 0,
          depth: Number(depth) || 0,
          target,
          status: status ? 1 : 0,
        });
        navigate("/admin/menu");
      } else {
        await adminApiPatch(`/api/admin/menu/items/${id}`, {
          parent_id: Number(parent_id) || 0,
          item_type,
          item_id: item_id.trim() ? Number(item_id) : null,
          item_title: item_title.trim(),
          item_url: item_url.trim() || null,
          menu_order: Number(menu_order) || 0,
          depth: Number(depth) || 0,
          target,
          status: status ? 1 : 0,
        });
        navigate("/admin/menu");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <div>
      <Link
        to="/admin/menu"
        className="text-sm font-medium text-admin-accent hover:underline"
      >
        ← Menu builder
      </Link>
      <h2 className="mt-4 text-2xl font-bold text-slate-800">
        {isNew ? "New menu item" : `Edit item #${id}`}
      </h2>
      {loading ? (
        <p className="mt-6 text-slate-500">Loading…</p>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 max-w-lg space-y-4">
          {isNew ? (
            <label className="block text-sm text-slate-700">
              Menu location id
              <input
                required
                type="number"
                min={1}
                value={menu_location_id}
                onChange={(e) => setMenuLocationId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
          ) : (
            <p className="text-sm text-slate-500">
              Location #{menu_location_id} (change via recreate if needed)
            </p>
          )}
          <label className="block text-sm text-slate-700">
            Parent id (0 = top)
            <input
              type="number"
              min={0}
              value={parent_id}
              onChange={(e) => setParentId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm text-slate-700">
            Type
            <select
              value={item_type}
              onChange={(e) => setItemType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              {ITEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-slate-700">
            Linked entity id (optional)
            <input
              type="number"
              value={item_id}
              onChange={(e) => setItemId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm text-slate-700">
            Title *
            <input
              required
              value={item_title}
              onChange={(e) => setItemTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm text-slate-700">
            URL
            <input
              value={item_url}
              onChange={(e) => setItemUrl(e.target.value)}
              placeholder="/packages or https://…"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-slate-700">
              Order
              <input
                type="number"
                value={menu_order}
                onChange={(e) => setMenuOrder(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="text-sm text-slate-700">
              Depth
              <input
                type="number"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
          </div>
          <label className="block text-sm text-slate-700">
            Target
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="_self">Same tab</option>
              <option value="_blank">New tab</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={status}
              onChange={(e) => setStatus(e.target.checked)}
            />
            Published
          </label>
          {err ? <p className="text-sm text-rose-600">{err}</p> : null}
          <button
            type="submit"
            className="rounded-lg bg-admin-accent px-4 py-2 text-sm text-white"
          >
            {isNew ? "Create" : "Save"}
          </button>
        </form>
      )}
    </div>
  );
}
