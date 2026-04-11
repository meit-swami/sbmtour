import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminApiGet, adminApiPost } from "@/lib/adminApi";
import { legacyMediaUrl } from "@/lib/media";

const VIEW_KEY = "sbm_admin_packages_view";
const GROUP_KEY = "sbm_admin_packages_group";
const PAGE_SIZE = 40;

const BULK_PRICE_ROWS: { label: string; disc: string; mrp: string }[] = [
  { label: "Single", disc: "single_discounted_price", mrp: "single_actual_price" },
  {
    label: "Twin / double",
    disc: "dual_discounted_price",
    mrp: "dual_actual_price",
  },
  {
    label: "Triple",
    disc: "triple_discounted_price",
    mrp: "triple_actual_price",
  },
  { label: "Quad", disc: "quad_discounted_price", mrp: "quad_actual_price" },
];

type PkgRow = {
  id: number;
  packName: string;
  package_slug: string;
  packType: string;
  status: number;
  is_featured: number;
  set_on_home?: number;
  today_deal?: number;
  featured_image: string | null;
  country_id: number;
  destination_id: number;
  country_name: string | null;
  destination_name?: string | null;
};

type CountryOpt = { id: number; country_name: string };
type DestOpt = {
  id: number;
  destination_name: string;
  country_name: string | null;
};

type GroupMode = "none" | "country" | "destination" | "packType";

function loadView(): "list" | "grid" {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === "grid" || v === "list") return v;
  } catch {
    /* ignore */
  }
  return "list";
}

function loadGroup(): GroupMode {
  try {
    const v = localStorage.getItem(GROUP_KEY);
    if (
      v === "country" ||
      v === "destination" ||
      v === "packType" ||
      v === "none"
    )
      return v;
  } catch {
    /* ignore */
  }
  return "none";
}

export function AdminPackagesListPage() {
  const [view, setView] = useState<"list" | "grid">(loadView);
  const [groupBy, setGroupBy] = useState<GroupMode>(loadGroup);
  const [rows, setRows] = useState<PkgRow[]>([]);
  const [meta, setMeta] = useState<{
    total: number;
    limit: number;
    offset: number;
  } | null>(null);
  const [page, setPage] = useState(0);
  const [statusF, setStatusF] = useState("");
  const [packTypeF, setPackTypeF] = useState("");
  const [countryF, setCountryF] = useState("");
  const [destF, setDestF] = useState("");
  const [featuredF, setFeaturedF] = useState(false);
  const [onHomeF, setOnHomeF] = useState(false);
  const [todayDealF, setTodayDealF] = useState(false);
  const [qInput, setQInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [countries, setCountries] = useState<CountryOpt[]>([]);
  const [destinations, setDestinations] = useState<DestOpt[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkPriceOpen, setBulkPriceOpen] = useState(false);
  const [bulkPriceDraft, setBulkPriceDraft] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        BULK_PRICE_ROWS.flatMap((r) => [
          [r.disc, ""],
          [r.mrp, ""],
        ])
      )
  );

  const offset = page * PAGE_SIZE;

  const packageListQs = useMemo(() => {
    const q = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    if (statusF === "0" || statusF === "1") q.set("status", statusF);
    if (packTypeF) q.set("packType", packTypeF);
    if (countryF) q.set("country_id", countryF);
    if (destF !== "") q.set("destination_id", destF);
    if (featuredF) q.set("featured", "1");
    if (onHomeF) q.set("on_home", "1");
    if (todayDealF) q.set("today_deal", "1");
    if (debouncedQ) q.set("q", debouncedQ);
    return q.toString();
  }, [
    offset,
    statusF,
    packTypeF,
    countryF,
    destF,
    featuredF,
    onHomeF,
    todayDealF,
    debouncedQ,
  ]);

  useEffect(() => {
    const t = window.setTimeout(
      () => setDebouncedQ(qInput.trim().slice(0, 120)),
      300
    );
    return () => window.clearTimeout(t);
  }, [qInput]);

  useEffect(() => {
    setPage(0);
  }, [
    statusF,
    packTypeF,
    countryF,
    destF,
    featuredF,
    onHomeF,
    todayDealF,
    debouncedQ,
  ]);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      /* ignore */
    }
  }, [view]);

  useEffect(() => {
    try {
      localStorage.setItem(GROUP_KEY, groupBy);
    } catch {
      /* ignore */
    }
  }, [groupBy]);

  useEffect(() => {
    adminApiGet<{ data: CountryOpt[] }>("/api/admin/countries?limit=200")
      .then((r) => setCountries(r.data))
      .catch(() => setCountries([]));
    adminApiGet<{ data: DestOpt[] }>("/api/admin/destinations?limit=200")
      .then((r) => setDestinations(r.data))
      .catch(() => setDestinations([]));
  }, []);

  useEffect(() => {
    adminApiGet<{
      data: PkgRow[];
      meta: { total: number; limit: number; offset: number };
    }>(`/api/admin/packages?${packageListQs}`)
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
        setErr(e instanceof Error ? e.message : "Failed to load");
        setRows([]);
      });
  }, [packageListQs]);

  const grouped = useMemo(() => {
    if (groupBy === "none") return [["", rows] as [string, PkgRow[]]];
    const sorted = [...rows].sort((a, b) => {
      if (groupBy === "country") {
        const ca = (a.country_name || "—").localeCompare(
          b.country_name || "—"
        );
        if (ca !== 0) return ca;
      } else if (groupBy === "destination") {
        const da = (a.destination_name || "—").localeCompare(
          b.destination_name || "—"
        );
        if (da !== 0) return da;
      } else if (groupBy === "packType") {
        const ta = (a.packType || "").localeCompare(b.packType || "");
        if (ta !== 0) return ta;
      }
      return b.id - a.id;
    });
    const map = new Map<string, PkgRow[]>();
    for (const p of sorted) {
      const key =
        groupBy === "country"
          ? p.country_name || "—"
          : groupBy === "destination"
            ? p.destination_name || "—"
            : p.packType || "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows, groupBy]);

  const totalPages =
    meta && meta.total > 0 ? Math.ceil(meta.total / PAGE_SIZE) : 0;
  const pageIds = rows.map((r) => r.id);
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  async function refetchList() {
    const r = await adminApiGet<{
      data: PkgRow[];
      meta: { total: number; limit: number; offset: number };
    }>(`/api/admin/packages?${packageListQs}`);
    setRows(r.data);
    setMeta({
      total: r.meta.total,
      limit: r.meta.limit,
      offset: r.meta.offset,
    });
  }

  async function bulkSetStatus(status: 0 | 1) {
    const ids = [...selected];
    if (!ids.length) return;
    setBulkBusy(true);
    setErr(null);
    try {
      await adminApiPost("/api/admin/packages/bulk-status", { ids, status });
      setSelected(new Set());
      await refetchList();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Bulk update failed");
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkSetOnHome(set_on_home: 0 | 1) {
    const ids = [...selected];
    if (!ids.length) return;
    setBulkBusy(true);
    setErr(null);
    try {
      await adminApiPost("/api/admin/packages/bulk-set-on-home", {
        ids,
        set_on_home,
      });
      setSelected(new Set());
      await refetchList();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Bulk update failed");
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkApplyPrices() {
    const ids = [...selected];
    if (!ids.length) return;
    const body: Record<string, unknown> = { ids };
    let any = false;
    for (const row of BULK_PRICE_ROWS) {
      for (const key of [row.disc, row.mrp] as const) {
        const s = (bulkPriceDraft[key] ?? "").trim();
        if (s === "") continue;
        const n = Number(s);
        if (!Number.isFinite(n) || n < 0) {
          setErr(`Invalid amount for ${key.replace(/_/g, " ")}`);
          return;
        }
        body[key] = n;
        any = true;
      }
    }
    if (!any) {
      setErr("Enter at least one price (INR) to apply.");
      return;
    }
    setBulkBusy(true);
    setErr(null);
    try {
      await adminApiPost("/api/admin/packages/bulk-prices", body);
      setSelected(new Set());
      setBulkPriceDraft(
        Object.fromEntries(
          BULK_PRICE_ROWS.flatMap((r) => [
            [r.disc, ""],
            [r.mrp, ""],
          ])
        )
      );
      await refetchList();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Bulk price update failed");
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkSetTodayDeal(today_deal: 0 | 1) {
    const ids = [...selected];
    if (!ids.length) return;
    setBulkBusy(true);
    setErr(null);
    try {
      await adminApiPost("/api/admin/packages/bulk-today-deal", {
        ids,
        today_deal,
      });
      setSelected(new Set());
      await refetchList();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Bulk update failed");
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkSetFeatured(is_featured: 0 | 1) {
    const ids = [...selected];
    if (!ids.length) return;
    setBulkBusy(true);
    setErr(null);
    try {
      await adminApiPost("/api/admin/packages/bulk-featured", {
        ids,
        is_featured,
      });
      setSelected(new Set());
      await refetchList();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Bulk update failed");
    } finally {
      setBulkBusy(false);
    }
  }

  function renderListTable(list: PkgRow[], showSelectAllInHeader: boolean) {
    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-600">
            <tr>
              <th className="w-10 px-2 py-2">
                {showSelectAllInHeader ? (
                  <input
                    type="checkbox"
                    title="Select page"
                    checked={allOnPageSelected}
                    onChange={() => toggleSelectAllPage()}
                    className="rounded border-slate-300"
                  />
                ) : null}
              </th>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Country</th>
              <th className="px-3 py-2">Destination</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggleSelect(r.id)}
                    className="rounded border-slate-300"
                  />
                </td>
                <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
                <td className="max-w-[200px] px-3 py-2 font-medium text-slate-800">
                  <span className="line-clamp-2">{r.packName}</span>
                  <span className="ml-1 inline-flex flex-wrap gap-0.5">
                    {r.is_featured ? (
                      <span className="text-xs text-amber-600" title="Featured">★</span>
                    ) : null}
                    {r.set_on_home ? (
                      <span className="text-xs text-sky-600" title="On home">⌂</span>
                    ) : null}
                    {r.today_deal ? (
                      <span className="text-xs text-rose-600" title="Today deal">●</span>
                    ) : null}
                  </span>
                </td>
                <td className="max-w-[140px] truncate px-3 py-2 text-xs text-slate-500">
                  {r.package_slug}
                </td>
                <td className="px-3 py-2 text-xs">{r.packType}</td>
                <td className="max-w-[120px] truncate px-3 py-2 text-xs">
                  {r.country_name ?? "—"}
                </td>
                <td className="max-w-[140px] truncate px-3 py-2 text-xs text-slate-600">
                  {r.destination_id > 0
                    ? (r.destination_name ?? "—")
                    : "—"}
                </td>
                <td className="px-3 py-2 text-xs">
                  {r.status ? (
                    <span className="text-emerald-600">Active</span>
                  ) : (
                    <span className="text-slate-400">Off</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    to={`/admin/packages/${r.id}`}
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
    );
  }

  function renderGrid(list: PkgRow[]) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((r) => {
          const img = legacyMediaUrl("packages", r.featured_image);
          return (
            <div
              key={r.id}
              className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="absolute left-2 top-2 z-10">
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={() => toggleSelect(r.id)}
                  className="h-4 w-4 rounded border-slate-300 bg-white shadow"
                />
              </div>
              <Link
                to={`/admin/packages/${r.id}`}
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
              >
                <div className="aspect-[4/3] bg-slate-100">
                  {img ? (
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                    {r.packName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {r.packType} · {r.package_slug}
                  </p>
                  {r.destination_id > 0 && r.destination_name ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-600">
                      {r.destination_name}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1 text-[10px] font-medium uppercase tracking-wide">
                    {r.status ? (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-800">
                        Active
                      </span>
                    ) : (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                        Inactive
                      </span>
                    )}
                    {r.is_featured ? (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">
                        Featured
                      </span>
                    ) : null}
                    {r.set_on_home ? (
                      <span className="rounded bg-sky-100 px-1.5 py-0.5 text-sky-800">
                        Home
                      </span>
                    ) : null}
                    {r.today_deal ? (
                      <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-800">
                        Deal
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-800">Packages</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`rounded-md px-3 py-1.5 font-medium ${
                view === "list"
                  ? "bg-admin-accent text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`rounded-md px-3 py-1.5 font-medium ${
                view === "grid"
                  ? "bg-admin-accent text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Grid
            </button>
          </div>
          <Link
            to="/admin/packages/new"
            className="rounded-lg bg-admin-accent px-4 py-2 text-sm font-medium text-white hover:bg-admin-accent-hover"
          >
            Add new
          </Link>
        </div>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Filter, group by country / destination / type (current page), bulk
        status / featured / on home / today deal / tiered prices. Thumbnails use
        legacy media paths.
        {meta ? ` · ${meta.total} matching` : null}
      </p>

      <div className="mt-4 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Search
            <input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Name or slug…"
              className="min-w-[180px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Group by
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupMode)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="none">None</option>
              <option value="country">Country</option>
              <option value="destination">Destination (folder)</option>
              <option value="packType">Package type</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Status
            <select
              value={statusF}
              onChange={(e) => setStatusF(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Any</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Type
            <select
              value={packTypeF}
              onChange={(e) => setPackTypeF(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Any</option>
              <option value="Domestic">Domestic</option>
              <option value="International">International</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Country
            <select
              value={countryF}
              onChange={(e) => setCountryF(e.target.value)}
              className="max-w-[200px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Any</option>
              {countries.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.country_name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Destination
            <select
              value={destF}
              onChange={(e) => setDestF(e.target.value)}
              className="max-w-[220px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Any</option>
              <option value="0">None (0)</option>
              {destinations.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.destination_name}
                  {d.country_name ? ` · ${d.country_name}` : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex cursor-pointer items-center gap-2 pt-5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={featuredF}
              onChange={(e) => setFeaturedF(e.target.checked)}
              className="rounded border-slate-300"
            />
            Featured only
          </label>
          <label className="flex cursor-pointer items-center gap-2 pt-5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={onHomeF}
              onChange={(e) => setOnHomeF(e.target.checked)}
              className="rounded border-slate-300"
            />
            On home only
          </label>
          <label className="flex cursor-pointer items-center gap-2 pt-5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={todayDealF}
              onChange={(e) => setTodayDealF(e.target.checked)}
              className="rounded border-slate-300"
            />
            Today deal only
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-sm text-slate-600">
            {selected.size} selected
          </span>
          <button
            type="button"
            disabled={bulkBusy || selected.size === 0}
            onClick={() => void bulkSetStatus(1)}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 disabled:opacity-40"
          >
            Set active
          </button>
          <button
            type="button"
            disabled={bulkBusy || selected.size === 0}
            onClick={() => void bulkSetStatus(0)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40"
          >
            Set inactive
          </button>
          <button
            type="button"
            disabled={bulkBusy || selected.size === 0}
            onClick={() => void bulkSetFeatured(1)}
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900 disabled:opacity-40"
          >
            Set featured
          </button>
          <button
            type="button"
            disabled={bulkBusy || selected.size === 0}
            onClick={() => void bulkSetFeatured(0)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 disabled:opacity-40"
          >
            Clear featured
          </button>
          <button
            type="button"
            disabled={bulkBusy || selected.size === 0}
            onClick={() => void bulkSetOnHome(1)}
            className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-800 disabled:opacity-40"
          >
            Set on home
          </button>
          <button
            type="button"
            disabled={bulkBusy || selected.size === 0}
            onClick={() => void bulkSetOnHome(0)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 disabled:opacity-40"
          >
            Clear on home
          </button>
          <button
            type="button"
            disabled={bulkBusy || selected.size === 0}
            onClick={() => void bulkSetTodayDeal(1)}
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-800 disabled:opacity-40"
          >
            Set today deal
          </button>
          <button
            type="button"
            disabled={bulkBusy || selected.size === 0}
            onClick={() => void bulkSetTodayDeal(0)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 disabled:opacity-40"
          >
            Clear today deal
          </button>
        </div>
        <div className="border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setBulkPriceOpen((o) => !o)}
            className="text-sm font-medium text-admin-accent hover:underline"
          >
            {bulkPriceOpen ? "▼" : "▶"} Bulk tiered prices (INR)
          </button>
          {bulkPriceOpen ? (
            <div className="mt-3 space-y-3">
              <p className="text-xs text-slate-600">
                Only filled fields are updated on{" "}
                <strong className="font-medium text-slate-800">selected</strong>{" "}
                rows (max 120 ids). Leave blank to leave that column unchanged.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {BULK_PRICE_ROWS.map((row) => (
                  <div
                    key={row.label}
                    className="rounded-lg border border-slate-200 bg-slate-50/80 p-3"
                  >
                    <p className="mb-2 text-xs font-semibold text-slate-700">
                      {row.label}
                    </p>
                    <label className="block text-[11px] text-slate-600">
                      Sale / discounted
                      <input
                        type="text"
                        inputMode="decimal"
                        value={bulkPriceDraft[row.disc] ?? ""}
                        onChange={(e) =>
                          setBulkPriceDraft((d) => ({
                            ...d,
                            [row.disc]: e.target.value,
                          }))
                        }
                        placeholder="—"
                        className="mt-0.5 w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm"
                      />
                    </label>
                    <label className="mt-2 block text-[11px] text-slate-600">
                      MRP / actual
                      <input
                        type="text"
                        inputMode="decimal"
                        value={bulkPriceDraft[row.mrp] ?? ""}
                        onChange={(e) =>
                          setBulkPriceDraft((d) => ({
                            ...d,
                            [row.mrp]: e.target.value,
                          }))
                        }
                        placeholder="—"
                        className="mt-0.5 w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm"
                      />
                    </label>
                  </div>
                ))}
              </div>
              <button
                type="button"
                disabled={bulkBusy || selected.size === 0}
                onClick={() => void bulkApplyPrices()}
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-900 disabled:opacity-40"
              >
                Apply prices to selected
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <button
            type="button"
            disabled={page <= 0}
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
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}

      {err ? <p className="mt-4 text-sm text-rose-600">{err}</p> : null}

      {view === "list" ? (
        <div className="space-y-6">
          {grouped.map(([label, list], idx) => (
            <div key={label || "all"}>
              {groupBy !== "none" ? (
                <h3 className="mb-2 text-sm font-semibold text-slate-700">
                  {label}{" "}
                  <span className="font-normal text-slate-400">
                    ({list.length})
                  </span>
                </h3>
              ) : null}
              {renderListTable(list, groupBy === "none" || idx === 0)}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([label, list]) => (
            <div key={label || "all"}>
              {groupBy !== "none" ? (
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  {label}{" "}
                  <span className="font-normal text-slate-400">
                    ({list.length})
                  </span>
                </h3>
              ) : null}
              {renderGrid(list)}
            </div>
          ))}
        </div>
      )}

      {rows.length === 0 && !err ? (
        <p className="mt-10 text-center text-slate-500">No packages match.</p>
      ) : null}
    </div>
  );
}
