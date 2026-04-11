import { useEffect, useState } from "react";
import { adminApiGet } from "@/lib/adminApi";

type Health = { ok: boolean; db: string };

type Stats = {
  countries: number;
  destinations: number;
  packages: number;
  hotels: number;
  vehicles: number;
  blogs: number;
  enquiries: number;
  leads: number;
};

const kpi: { label: string; field: keyof Stats }[] = [
  { label: "Countries", field: "countries" },
  { label: "Destinations", field: "destinations" },
  { label: "Packages", field: "packages" },
  { label: "Hotels", field: "hotels" },
  { label: "Vehicles", field: "vehicles" },
  { label: "Blogs", field: "blogs" },
];

export function AdminDashboardPage() {
  const [db, setDb] = useState<string>("…");
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsErr, setStatsErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((h: Health) => setDb(h.db))
      .catch(() => setDb("offline"));
  }, []);

  useEffect(() => {
    adminApiGet<{ data: Stats }>("/api/admin/dashboard-stats")
      .then((r) => {
        setStats(r.data);
        setStatsErr(null);
      })
      .catch((e) => {
        setStats(null);
        setStatsErr(
          e instanceof Error ? e.message : "Could not load dashboard stats"
        );
      });
  }, []);

  return (
    <div>
      <p className="text-sm text-slate-500">
        Database:{" "}
        <span
          className={
            db === "up"
              ? "font-medium text-emerald-600"
              : "font-medium text-amber-600"
          }
        >
          {db}
        </span>
      </p>
      <h2 className="mt-2 text-2xl font-bold text-slate-800">Dashboard</h2>
      <p className="mt-1 text-slate-600">
        Sign in required for KPI counts (JWT). Public{" "}
        <code className="text-xs">/api/health</code> shows DB ping only.
      </p>

      {statsErr ? (
        <p className="mt-4 text-sm text-rose-600">{statsErr}</p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpi.map((k) => (
          <div
            key={k.field}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{k.label}</p>
            <p className="mt-2 text-3xl font-bold text-admin-accent">
              {stats ? stats[k.field].toLocaleString() : "—"}
            </p>
          </div>
        ))}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Enquiries</p>
          <p className="mt-2 text-3xl font-bold text-admin-accent">
            {stats ? stats.enquiries.toLocaleString() : "—"}
          </p>
          <p className="mt-1 font-mono text-xs text-slate-400">contactform</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Leads</p>
          <p className="mt-2 text-3xl font-bold text-admin-accent">
            {stats ? stats.leads.toLocaleString() : "—"}
          </p>
          <p className="mt-1 font-mono text-xs text-slate-400">leads</p>
        </div>
      </div>
    </div>
  );
}
