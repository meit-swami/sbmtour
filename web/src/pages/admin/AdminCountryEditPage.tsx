import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminApiGet, adminApiPatch, adminApiPost } from "@/lib/adminApi";
import { uploadAdminFile } from "@/lib/adminUpload";

export function AdminCountryEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";
  const [country_name, setCountryName] = useState("");
  const [country_slug, setCountrySlug] = useState("");
  const [country_image, setCountryImage] = useState("");
  const [product_features, setProductFeatures] = useState("");
  const [set_on_home, setSetOnHome] = useState(false);
  const [status, setStatus] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew || !id) return;
    setLoading(true);
    adminApiGet<{ data: Record<string, string | number> }>(
      `/api/admin/countries/${id}`
    )
      .then((r) => {
        const d = r.data;
        setCountryName(String(d.country_name ?? ""));
        setCountrySlug(String(d.country_slug ?? ""));
        setCountryImage(String(d.country_image ?? ""));
        setProductFeatures(String(d.product_features ?? ""));
        setSetOnHome(Number(d.set_on_home) === 1);
        setStatus(Number(d.status) !== 0);
        setErr(null);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      if (isNew) {
        const r = await adminApiPost<{ data: { id: number } }>(
          "/api/admin/countries",
          {
            country_name,
            country_slug: country_slug || undefined,
            country_image,
            product_features,
            set_on_home: set_on_home ? 1 : 0,
            status: status ? 1 : 0,
          }
        );
        navigate(`/admin/countries/${r.data.id}`, { replace: true });
      } else {
        await adminApiPatch(`/api/admin/countries/${id}`, {
          country_name,
          country_slug: country_slug || undefined,
          country_image,
          product_features,
          set_on_home: set_on_home ? 1 : 0,
          status: status ? 1 : 0,
        });
        navigate("/admin/countries");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <div>
      <Link
        to="/admin/countries"
        className="text-sm font-medium text-admin-accent hover:underline"
      >
        ← Countries
      </Link>
      <h2 className="mt-4 text-2xl font-bold text-slate-800">
        {isNew ? "New country" : `Edit country #${id}`}
      </h2>
      {loading ? (
        <p className="mt-6 text-slate-500">Loading…</p>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 max-w-xl space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Name
            <input
              required
              value={country_name}
              onChange={(e) => setCountryName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Slug (optional — auto from name)
            <input
              value={country_slug}
              onChange={(e) => setCountrySlug(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Image filename
            <input
              value={country_image}
              onChange={(e) => setCountryImage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
            />
            <input
              type="file"
              accept="image/*"
              className="mt-2 block text-xs text-slate-500"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                void uploadAdminFile("country", f)
                  .then((r) => setCountryImage(r.filename))
                  .catch((err) =>
                    setErr(err instanceof Error ? err.message : "Upload failed")
                  );
              }}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Description (HTML)
            <textarea
              value={product_features}
              onChange={(e) => setProductFeatures(e.target.value)}
              rows={6}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={set_on_home}
              onChange={(e) => setSetOnHome(e.target.checked)}
            />
            Show on home
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={status}
              onChange={(e) => setStatus(e.target.checked)}
            />
            Published (status = 1)
          </label>
          {err ? <p className="text-sm text-rose-600">{err}</p> : null}
          <button
            type="submit"
            className="rounded-lg bg-admin-accent px-4 py-2 text-sm font-medium text-white hover:bg-admin-accent-hover"
          >
            {isNew ? "Create" : "Save"}
          </button>
        </form>
      )}
    </div>
  );
}
