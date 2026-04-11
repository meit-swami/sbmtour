import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { adminApiGet, adminApiPatch, adminApiPost } from "@/lib/adminApi";
import { uploadAdminFile } from "@/lib/adminUpload";

type CountryOpt = { id: number; country_name: string };

export function AdminDestinationEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";
  const [countries, setCountries] = useState<CountryOpt[]>([]);
  const [country_id, setCountryId] = useState("");
  const [destination_name, setDestinationName] = useState("");
  const [destination_slug, setDestinationSlug] = useState("");
  const [destination_cat, setDestinationCat] = useState("");
  const [destination_type, setDestinationType] = useState("");
  const [destDesc, setDestDesc] = useState("");
  const [metaTagDesc, setMetaTagDesc] = useState("");
  const [keyword, setKeyword] = useState("");
  const [destination_image, setDestinationImage] = useState("");
  const [today_deal, setTodayDeal] = useState(false);
  const [status, setStatus] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    adminApiGet<{ data: Record<string, unknown>[] }>(
      "/api/admin/countries?limit=500"
    ).then((r) => {
      setCountries(
        (r.data ?? []).map((c) => ({
          id: c.id as number,
          country_name: String(c.country_name),
        }))
      );
    });
  }, []);

  useEffect(() => {
    if (isNew || !id) return;
    setLoading(true);
    adminApiGet<{ data: Record<string, unknown> }>(
      `/api/admin/destinations/${id}`
    )
      .then((r) => {
        const d = r.data;
        setCountryId(String(d.country_id ?? ""));
        setDestinationName(String(d.destination_name ?? ""));
        setDestinationSlug(String(d.destination_slug ?? ""));
        setDestinationCat(String(d.destination_cat ?? ""));
        setDestinationType(String(d.destination_type ?? ""));
        setDestDesc(String(d.destDesc ?? ""));
        setMetaTagDesc(String(d.metaTagDesc ?? ""));
        setKeyword(String(d.keyword ?? ""));
        setDestinationImage(String(d.destination_image ?? ""));
        setTodayDeal(Number(d.today_deal) === 1);
        setStatus(Number(d.status) !== 0);
        setErr(null);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    const cid = Number(country_id);
    if (!Number.isFinite(cid) || cid < 1) {
      setErr("Select a country");
      return;
    }
    try {
      if (isNew) {
        const r = await adminApiPost<{ data: { id: number } }>(
          "/api/admin/destinations",
          {
            country_id: cid,
            destination_name,
            destination_slug: destination_slug || undefined,
            destination_cat,
            destination_type,
            destDesc,
            metaTagDesc,
            keyword,
            destination_image,
            today_deal: today_deal ? 1 : 0,
            status: status ? 1 : 0,
          }
        );
        navigate(`/admin/destinations/${r.data.id}`, { replace: true });
      } else {
        await adminApiPatch(`/api/admin/destinations/${id}`, {
          country_id: cid,
          destination_name,
          destination_slug: destination_slug || undefined,
          destination_cat,
          destination_type,
          destDesc,
          metaTagDesc,
          keyword,
          destination_image,
          today_deal: today_deal ? 1 : 0,
          status: status ? 1 : 0,
        });
        navigate("/admin/destinations");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <div>
      <Link
        to="/admin/destinations"
        className="text-sm font-medium text-admin-accent hover:underline"
      >
        ← Destinations
      </Link>
      <h2 className="mt-4 text-2xl font-bold text-slate-800">
        {isNew ? "New destination" : `Edit destination #${id}`}
      </h2>
      {loading ? (
        <p className="mt-6 text-slate-500">Loading…</p>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 max-w-xl space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Country
            <select
              required
              value={country_id}
              onChange={(e) => setCountryId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">—</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.country_name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Destination name
            <input
              required
              value={destination_name}
              onChange={(e) => setDestinationName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Slug (optional)
            <input
              value={destination_slug}
              onChange={(e) => setDestinationSlug(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Category
            <input
              value={destination_cat}
              onChange={(e) => setDestinationCat(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Type (e.g. Featured Destinations)
            <input
              value={destination_type}
              onChange={(e) => setDestinationType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Description HTML
            <textarea
              value={destDesc}
              onChange={(e) => setDestDesc(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Meta description
            <input
              value={metaTagDesc}
              onChange={(e) => setMetaTagDesc(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Keywords
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Featured image filename
            <input
              value={destination_image}
              onChange={(e) => setDestinationImage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
            />
            <input
              type="file"
              accept="image/*"
              className="mt-2 block text-xs text-slate-500"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                void uploadAdminFile("destination", f)
                  .then((r) => setDestinationImage(r.filename))
                  .catch((err) =>
                    setErr(err instanceof Error ? err.message : "Upload failed")
                  );
              }}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={today_deal}
              onChange={(e) => setTodayDeal(e.target.checked)}
            />
            Today deal
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
            className="rounded-lg bg-admin-accent px-4 py-2 text-sm font-medium text-white hover:bg-admin-accent-hover"
          >
            {isNew ? "Create" : "Save"}
          </button>
        </form>
      )}
    </div>
  );
}
