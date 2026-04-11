import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApiGet } from "@/lib/adminApi";

type Props = {
  title: string;
  listPath: string;
  /** Full path including query e.g. `/api/admin/countries?limit=100` */
  apiPath: string;
  nameKey: string;
  newPath?: string;
};

export function AdminApiListPage({
  title,
  listPath,
  apiPath,
  nameKey,
  newPath,
}: Props) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ total: number } | null>(null);

  useEffect(() => {
    adminApiGet<{ data: Record<string, unknown>[]; meta?: { total: number } }>(
      apiPath
    )
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : [];
        setRows(list);
        setMeta({ total: r.meta?.total ?? list.length });
        setErr(null);
      })
      .catch((e) => {
        setErr(e instanceof Error ? e.message : "Failed to load");
        setRows([]);
      });
  }, [apiPath]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        {newPath ? (
          <Link
            to={newPath}
            className="rounded-lg bg-admin-accent px-4 py-2 text-sm font-medium text-white hover:bg-admin-accent-hover"
          >
            Add new
          </Link>
        ) : null}
      </div>
      {err ? <p className="mt-4 text-sm text-rose-600">{err}</p> : null}
      {meta ? (
        <p className="mt-2 text-sm text-slate-500">{meta.total} records</p>
      ) : (
        <p className="mt-2 text-sm text-slate-500">0 records</p>
      )}
      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2 font-semibold">ID</th>
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const id = r.id as number;
              const name = String(r[nameKey] ?? "—");
              return (
                <tr key={id} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-mono text-xs">{id}</td>
                  <td className="px-3 py-2 text-slate-800">{name}</td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      to={`${listPath}/${id}`}
                      className="text-admin-accent hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && !err ? (
        <p className="mt-8 text-center text-slate-500">No rows.</p>
      ) : null}
    </div>
  );
}
