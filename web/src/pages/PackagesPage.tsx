import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { PackageCard } from "@/components/site/PackageCard";
import { apiGet } from "@/lib/api";
import { cn } from "@/lib/utils";
import { usePageMeta } from "@/hooks/usePageMeta";
import type { PackageRow } from "@/types/home";

const PACK_TYPES = ["Domestic", "International"] as const;

type SortKey = "popular" | "price-asc" | "price-desc";

export function PackagesPage() {
  usePageMeta(
    "Tour Packages | SBM Tour India",
    "Browse curated domestic and international tour packages."
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const packType = (searchParams.get("packType") ?? "") as
    | (typeof PACK_TYPES)[number]
    | "";
  const sort = (searchParams.get("sort") ?? "popular") as SortKey;

  const [list, setList] = useState<PackageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [localQ, setLocalQ] = useState(q);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setLocalQ(q);
  }, [q]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (packType) p.set("packType", packType);
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

  const sorted = useMemo(() => {
    const arr = [...list];
    const priceOf = (p: PackageRow) => {
      const v =
        p.dual_discounted_price ??
        p.single_discounted_price ??
        p.dual_actual_price ??
        p.single_actual_price ??
        0;
      return typeof v === "string" ? Number(v) : Number(v ?? 0);
    };
    if (sort === "price-asc") arr.sort((a, b) => priceOf(a) - priceOf(b));
    else if (sort === "price-desc") arr.sort((a, b) => priceOf(b) - priceOf(a));
    return arr;
  }, [list, sort]);

  function applyFilters(e: FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    const t = localQ.trim();
    if (t) next.set("q", t);
    else next.delete("q");
    setSearchParams(next);
  }

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  return (
    <>
      <PageHero
        title="Explore Packages"
        subtitle={`Find the perfect getaway from ${list.length || "100+"} curated trips.`}
      />

      <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[280px_1fr] lg:px-8">
        <div className="mb-2 flex items-center justify-between lg:hidden">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
          <SortDropdown value={sort} onChange={(v) => setParam("sort", v)} />
        </div>

        <aside
          className={cn(
            filtersOpen
              ? "fixed inset-0 z-50 overflow-y-auto bg-background p-5"
              : "hidden",
            "lg:sticky lg:top-24 lg:block lg:h-fit lg:bg-transparent lg:p-0"
          )}
        >
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Filters</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchParams(new URLSearchParams());
                    setLocalQ("");
                  }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="lg:hidden"
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={applyFilters} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold">Search</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={localQ}
                    onChange={(e) => setLocalQ(e.target.value)}
                    placeholder="Bali, Kerala, Goa…"
                    className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Type</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setParam("packType", "")}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      !packType
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/40"
                    )}
                  >
                    All
                  </button>
                  {PACK_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setParam("packType", t)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                        packType === t
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background hover:border-primary/40"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-cta px-4 py-2.5 text-sm font-semibold text-cta-foreground shadow-cta hover:bg-cta/90"
              >
                Apply
              </button>
            </form>
          </div>
        </aside>

        <main>
          <div className="mb-6 hidden items-center justify-between lg:flex">
            <p className="text-sm text-muted-foreground">
              {sorted.length} package{sorted.length !== 1 && "s"} found
            </p>
            <SortDropdown value={sort} onChange={(v) => setParam("sort", v)} />
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-80 animate-pulse rounded-2xl border border-border bg-card"
                />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">No packages match your filters.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {sorted.map((p) => (
                <PackageCard key={p.id} pkg={p} />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

function SortDropdown({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortKey)}
      className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium"
    >
      <option value="popular">Most popular</option>
      <option value="price-asc">Price: low to high</option>
      <option value="price-desc">Price: high to low</option>
    </select>
  );
}

function PageHero({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-border bg-secondary/40 pb-12 pt-28">
      <div className="container mx-auto px-4 lg:px-8">
        <h1 className="font-display text-3xl font-bold md:text-5xl">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
