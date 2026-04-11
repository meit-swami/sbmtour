import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  adminApiGet,
  adminApiPatch,
  adminApiPost,
  adminApiPut,
} from "@/lib/adminApi";
import { uploadAdminFile } from "@/lib/adminUpload";

type CountryOpt = { id: number; country_name: string };
type ItRow = { itineraryDay: number; itineraryHeading: string; itineraryDesc: string };

export function AdminPackageEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";
  const [countries, setCountries] = useState<CountryOpt[]>([]);
  const [country_id, setCountryId] = useState("");
  const [destination_id, setDestinationId] = useState("0");
  const [packName, setPackName] = useState("");
  const [packType, setPackType] = useState("Domestic");
  const [packDuration, setPackDuration] = useState("3 Days 2 Nights");
  const [typeOfTrip, setTypeOfTrip] = useState("Road");
  const [startCity, setStartCity] = useState("");
  const [endCity, setEndCity] = useState("");
  const [packDesc, setPackDesc] = useState("");
  const [metaTagDesc, setMetaTagDesc] = useState("");
  const [keyword, setKeyword] = useState("");
  const [title, setTitle] = useState("");
  const [package_title, setPackageTitle] = useState("");
  const [package_slug, setPackageSlug] = useState("");
  const [package_desc, setPackageDesc] = useState("");
  const [featured_image, setFeaturedImage] = useState("");
  const [is_featured, setIsFeatured] = useState(false);
  const [set_on_home, setSetOnHome] = useState(false);
  const [today_deal, setTodayDeal] = useState(false);
  const [status, setStatus] = useState(true);
  const [itineraryJson, setItineraryJson] = useState("[]");
  const [inclusionsText, setInclusionsText] = useState("");
  const [exclusionsText, setExclusionsText] = useState("");
  const [galleryText, setGalleryText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
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
    adminApiGet<{
      data: {
        package: Record<string, unknown>;
        itinerary: ItRow[];
        inclusions: { inclusion: string }[];
        exclusions: { exclusion: string }[];
        gallery: { image_file: string }[];
      };
    }>(`/api/admin/packages/${id}`)
      .then((r) => {
        const p = r.data.package;
        setCountryId(String(p.country_id ?? ""));
        setDestinationId(String(p.destination_id ?? "0"));
        setPackName(String(p.packName ?? ""));
        setPackType(String(p.packType ?? "Domestic"));
        setPackDuration(String(p.packDuration ?? ""));
        setTypeOfTrip(String(p.typeOfTrip ?? ""));
        setStartCity(String(p.startCity ?? ""));
        setEndCity(String(p.endCity ?? ""));
        setPackDesc(String(p.packDesc ?? ""));
        setMetaTagDesc(String(p.metaTagDesc ?? ""));
        setKeyword(String(p.keyword ?? ""));
        setTitle(String(p.title ?? ""));
        setPackageTitle(String(p.package_title ?? ""));
        setPackageSlug(String(p.package_slug ?? ""));
        setPackageDesc(String(p.package_desc ?? ""));
        setFeaturedImage(String(p.featured_image ?? ""));
        setIsFeatured(Number(p.is_featured) === 1);
        setSetOnHome(Number(p.set_on_home) === 1);
        setTodayDeal(Number(p.today_deal) === 1);
        setStatus(Number(p.status) !== 0);
        const it = (r.data.itinerary ?? []).map((row) => ({
          itineraryDay: Number(row.itineraryDay),
          itineraryHeading: String(row.itineraryHeading ?? ""),
          itineraryDesc: String(row.itineraryDesc ?? ""),
        }));
        setItineraryJson(JSON.stringify(it, null, 2));
        setInclusionsText(
          (r.data.inclusions ?? []).map((x) => x.inclusion).join("\n")
        );
        setExclusionsText(
          (r.data.exclusions ?? []).map((x) => x.exclusion).join("\n")
        );
        setGalleryText(
          (r.data.gallery ?? []).map((x) => x.image_file).join("\n")
        );
        setErr(null);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  async function createNew(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    const cid = Number(country_id);
    if (!Number.isFinite(cid) || cid < 1 || !packName.trim()) {
      setErr("Country and package name required");
      return;
    }
    try {
      const r = await adminApiPost<{ data: { id: number } }>(
        "/api/admin/packages",
        {
          country_id: cid,
          destination_id: Number(destination_id) || 0,
          packName: packName.trim(),
          packType,
          packDuration,
          typeOfTrip,
          startCity,
          endCity,
          packDesc,
          metaTagDesc,
          keyword,
          title: title || packName,
          package_title: package_title || packName,
          package_slug: package_slug || undefined,
          package_desc: package_desc || packDesc,
          featured_image,
          is_featured: is_featured ? 1 : 0,
          set_on_home: set_on_home ? 1 : 0,
          today_deal: today_deal ? 1 : 0,
          status: status ? 1 : 0,
        }
      );
      navigate(`/admin/packages/${r.data.id}`, { replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Create failed");
    }
  }

  async function saveMain(e: FormEvent) {
    e.preventDefault();
    if (!id || isNew) return;
    setErr(null);
    setMsg(null);
    try {
      await adminApiPatch(`/api/admin/packages/${id}`, {
        country_id: Number(country_id),
        destination_id: Number(destination_id) || 0,
        packName,
        packType,
        packDuration,
        typeOfTrip,
        startCity,
        endCity,
        packDesc,
        metaTagDesc,
        keyword,
        title,
        package_title,
        package_slug: package_slug || undefined,
        package_desc,
        featured_image,
        is_featured: is_featured ? 1 : 0,
        set_on_home: set_on_home ? 1 : 0,
        today_deal: today_deal ? 1 : 0,
        status: status ? 1 : 0,
      });
      setMsg("Package core saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function saveItinerary() {
    if (!id || isNew) return;
    setErr(null);
    setMsg(null);
    let rows: ItRow[];
    try {
      rows = JSON.parse(itineraryJson) as ItRow[];
      if (!Array.isArray(rows)) throw new Error("Not an array");
    } catch {
      setErr("Itinerary JSON invalid");
      return;
    }
    try {
      await adminApiPut(`/api/admin/packages/${id}/itinerary`, { rows });
      setMsg("Itinerary saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function saveInc() {
    if (!id || isNew) return;
    setErr(null);
    setMsg(null);
    const lines = inclusionsText.split("\n").map((s) => s.trim()).filter(Boolean);
    try {
      await adminApiPut(`/api/admin/packages/${id}/inclusions`, { lines });
      setMsg("Inclusions saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function saveExc() {
    if (!id || isNew) return;
    setErr(null);
    setMsg(null);
    const lines = exclusionsText.split("\n").map((s) => s.trim()).filter(Boolean);
    try {
      await adminApiPut(`/api/admin/packages/${id}/exclusions`, { lines });
      setMsg("Exclusions saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function saveGallery() {
    if (!id || isNew) return;
    setErr(null);
    setMsg(null);
    const files = galleryText.split("\n").map((s) => s.trim()).filter(Boolean);
    try {
      await adminApiPut(`/api/admin/packages/${id}/gallery`, { files });
      setMsg("Gallery saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    }
  }

  if (isNew) {
    return (
      <div>
        <Link
          to="/admin/packages"
          className="text-sm font-medium text-admin-accent hover:underline"
        >
          ← Packages
        </Link>
        <h2 className="mt-4 text-2xl font-bold text-slate-800">New package</h2>
        <form onSubmit={(e) => void createNew(e)} className="mt-6 max-w-xl space-y-4">
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
            Destination id (0 if none)
            <input
              type="number"
              min={0}
              value={destination_id}
              onChange={(e) => setDestinationId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Package name
            <input
              required
              value={packName}
              onChange={(e) => setPackName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Type
            <select
              value={packType}
              onChange={(e) => setPackType(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="Domestic">Domestic</option>
              <option value="International">International</option>
              <option value="Local Sight Seeing">Local Sight Seeing</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Duration
            <input
              value={packDuration}
              onChange={(e) => setPackDuration(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          {err ? <p className="text-sm text-rose-600">{err}</p> : null}
          <button
            type="submit"
            className="rounded-lg bg-admin-accent px-4 py-2 text-sm font-medium text-white hover:bg-admin-accent-hover"
          >
            Create &amp; continue editing
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/admin/packages"
        className="text-sm font-medium text-admin-accent hover:underline"
      >
        ← Packages
      </Link>
      <h2 className="mt-4 text-2xl font-bold text-slate-800">
        Edit package #{id}
      </h2>
      {loading ? (
        <p className="mt-6 text-slate-500">Loading…</p>
      ) : (
        <div className="mt-6 space-y-10">
          {err ? <p className="text-sm text-rose-600">{err}</p> : null}
          {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}

          <form onSubmit={(e) => void saveMain(e)} className="max-w-2xl space-y-3">
            <h3 className="text-lg font-semibold text-slate-800">Core fields</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm text-slate-700">
                Country id
                <input
                  value={country_id}
                  onChange={(e) => setCountryId(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                />
              </label>
              <label className="text-sm text-slate-700">
                Destination id
                <input
                  value={destination_id}
                  onChange={(e) => setDestinationId(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                />
              </label>
            </div>
            <label className="block text-sm text-slate-700">
              Name
              <input
                value={packName}
                onChange={(e) => setPackName(e.target.value)}
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm text-slate-700">
                Pack type
                <input
                  value={packType}
                  onChange={(e) => setPackType(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                />
              </label>
              <label className="text-sm text-slate-700">
                Duration
                <input
                  value={packDuration}
                  onChange={(e) => setPackDuration(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                />
              </label>
            </div>
            <label className="block text-sm text-slate-700">
              Trip type
              <input
                value={typeOfTrip}
                onChange={(e) => setTypeOfTrip(e.target.value)}
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm text-slate-700">
                Start city
                <input
                  value={startCity}
                  onChange={(e) => setStartCity(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                />
              </label>
              <label className="text-sm text-slate-700">
                End city
                <input
                  value={endCity}
                  onChange={(e) => setEndCity(e.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                />
              </label>
            </div>
            <label className="block text-sm text-slate-700">
              Slug
              <input
                value={package_slug}
                onChange={(e) => setPackageSlug(e.target.value)}
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1 font-mono text-xs"
              />
            </label>
            <label className="block text-sm text-slate-700">
              Featured image
              <input
                value={featured_image}
                onChange={(e) => setFeaturedImage(e.target.value)}
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1 font-mono text-xs"
              />
              <input
                type="file"
                accept="image/*"
                className="mt-1 text-xs"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  void uploadAdminFile("packages", f)
                    .then((r) => setFeaturedImage(r.filename))
                    .catch(() => {});
                }}
              />
            </label>
            <label className="block text-sm text-slate-700">
              Pack description (HTML)
              <textarea
                value={packDesc}
                onChange={(e) => setPackDesc(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1 font-mono text-xs"
              />
            </label>
            <label className="block text-sm text-slate-700">
              Short package desc
              <textarea
                value={package_desc}
                onChange={(e) => setPackageDesc(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1 font-mono text-xs"
              />
            </label>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={is_featured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                Featured
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={set_on_home}
                  onChange={(e) => setSetOnHome(e.target.checked)}
                />
                On home
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={today_deal}
                  onChange={(e) => setTodayDeal(e.target.checked)}
                />
                Today deal
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={status}
                  onChange={(e) => setStatus(e.target.checked)}
                />
                Published
              </label>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-admin-accent px-4 py-2 text-sm text-white"
            >
              Save core
            </button>
          </form>

          <div className="max-w-2xl">
            <h3 className="text-lg font-semibold text-slate-800">Itinerary (JSON)</h3>
            <textarea
              value={itineraryJson}
              onChange={(e) => setItineraryJson(e.target.value)}
              rows={12}
              className="mt-2 w-full rounded border border-slate-200 bg-slate-50 p-2 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => void saveItinerary()}
              className="mt-2 rounded-lg border border-slate-300 px-3 py-1 text-sm"
            >
              Save itinerary
            </button>
          </div>

          <div className="max-w-2xl grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-semibold text-slate-800">Inclusions (one per line)</h3>
              <textarea
                value={inclusionsText}
                onChange={(e) => setInclusionsText(e.target.value)}
                rows={10}
                className="mt-2 w-full rounded border border-slate-200 p-2 text-xs"
              />
              <button
                type="button"
                onClick={() => void saveInc()}
                className="mt-2 rounded-lg border border-slate-300 px-3 py-1 text-sm"
              >
                Save inclusions
              </button>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Exclusions (one per line)</h3>
              <textarea
                value={exclusionsText}
                onChange={(e) => setExclusionsText(e.target.value)}
                rows={10}
                className="mt-2 w-full rounded border border-slate-200 p-2 text-xs"
              />
              <button
                type="button"
                onClick={() => void saveExc()}
                className="mt-2 rounded-lg border border-slate-300 px-3 py-1 text-sm"
              >
                Save exclusions
              </button>
            </div>
          </div>

          <div className="max-w-2xl">
            <h3 className="font-semibold text-slate-800">
              Gallery filenames (one per line)
            </h3>
            <textarea
              value={galleryText}
              onChange={(e) => setGalleryText(e.target.value)}
              rows={6}
              className="mt-2 w-full rounded border border-slate-200 p-2 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => void saveGallery()}
              className="mt-2 rounded-lg border border-slate-300 px-3 py-1 text-sm"
            >
              Save gallery
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
