import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { pickLeadPrice } from "@/lib/pricing";
import { formatInr } from "@/lib/text";
import type { PackageRow } from "@/types/home";

export function PackagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const packType = searchParams.get("packType") ?? "";

  const [list, setList] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [localQ, setLocalQ] = useState(q);

  useEffect(() => {
    setLocalQ(q);
  }, [q]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (packType === "Domestic" || packType === "International") {
      p.set("packType", packType);
    }
    if (q.trim()) p.set("q", q.trim());
    p.set("limit", "48");
    return p.toString();
  }, [packType, q]);

  useEffect(() => {
    setLoading(true);
    apiGet<{ data: PackageRow[] }>(`/api/packages?${queryString}`)
      .then((r) => setList(r.data))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [queryString]);

  function applyFilters(e: FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    const t = localQ.trim();
    if (t) next.set("q", t);
    else next.delete("q");
    setSearchParams(next);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-brand-navy">Tour packages</h1>
      <p className="mt-2 text-slate-600">
        Search and filter by domestic or international — data from{" "}
        <code className="text-xs">tbl_package</code>.
      </p>

      <form
        onSubmit={applyFilters}
        className="mt-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-end"
      >
        <div className="flex-1">
          <label htmlFor="pkg-q" className="text-xs font-medium text-slate-500">
            Search
          </label>
          <input
            id="pkg-q"
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            placeholder="Package name…"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="pkg-type" className="text-xs font-medium text-slate-500">
            Type
          </label>
          <select
            id="pkg-type"
            value={packType}
            onChange={(e) => {
              const v = e.target.value;
              const next = new URLSearchParams(searchParams);
              if (v === "Domestic" || v === "International") {
                next.set("packType", v);
              } else {
                next.delete("packType");
              }
              setSearchParams(next);
            }}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm md:w-48"
          >
            <option value="">All types</option>
            <option value="Domestic">Domestic</option>
            <option value="International">International</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-brand-navy px-5 py-2 text-sm font-semibold text-white hover:bg-brand-navy-light"
        >
          Search
        </button>
      </form>

      <div className="mt-10 space-y-4">
        {loading ? (
          <p className="text-center text-slate-500">Loading…</p>
        ) : (
          list.map((p) => {
            const thumb = legacyMediaUrl("packages", p.featured_image);
            const price = formatInr(pickLeadPrice(p));
            return (
              <article
                key={p.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"
              >
                <Link
                  to={`/packages/${p.package_slug}`}
                  className="flex h-40 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-32 sm:w-44"
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-slate-500">{p.packType}</span>
                    {p.is_featured ? (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        Featured
                      </span>
                    ) : null}
                  </div>
                  <Link
                    to={`/packages/${p.package_slug}`}
                    className="mt-1 block text-lg font-semibold text-brand-navy hover:text-brand-accent"
                  >
                    {p.packName}
                  </Link>
                  <p className="text-sm text-slate-600">
                    {[p.destination_name, p.country_name]
                      .filter(Boolean)
                      .join(" · ") || p.country_name}{" "}
                    · {p.packDuration}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {price ? (
                      <span className="font-bold text-brand-navy">
                        From {price}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">Ask for quote</span>
                    )}
                    <Link
                      to={`/packages/${p.package_slug}`}
                      className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-accent-hover"
                    >
                      View details
                    </Link>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {!loading && list.length === 0 ? (
        <p className="mt-12 text-center text-slate-500">No packages match.</p>
      ) : null}
    </div>
  );
}
