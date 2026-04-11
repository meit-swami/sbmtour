import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { apiGet, apiPost } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { pickLeadPrice, pickTierPrice } from "@/lib/pricing";
import { sanitizedHtml } from "@/lib/sanitizeHtml";
import { formatInr } from "@/lib/text";
import { usePageMeta } from "@/hooks/usePageMeta";

type PackageDetail = {
  id: number;
  packName: string;
  package_slug: string;
  packDuration: string;
  packType: string;
  packDesc: string;
  metaTagDesc?: string;
  package_desc: string;
  featured_image: string;
  country_name: string;
  destination_name: string | null;
  single_discounted_price: string | number | null;
  dual_discounted_price: string | number | null;
  triple_discounted_price: string | number | null;
  quad_discounted_price: string | number | null;
  single_actual_price: string | number | null;
  dual_actual_price: string | number | null;
  triple_actual_price: string | number | null;
  quad_actual_price: string | number | null;
};

type ItinRow = {
  itineraryDay: number;
  itineraryHeading: string;
  itineraryDesc: string;
};

type PackageReview = {
  id: number;
  rating: number | string;
  rating_desc: string;
  created_at: string;
  reviewer_name: string;
};

type PackageFullResponse = {
  data: {
    package: PackageDetail;
    itinerary: ItinRow[];
    inclusions: { inclusion: string }[];
    exclusions: { exclusion: string }[];
    gallery: { image_file: string; type: string }[];
    similar: PackageDetail[];
    reviews: PackageReview[];
  };
};

type PackageTab =
  | "details"
  | "itinerary"
  | "inclusions"
  | "exclusions"
  | "photos"
  | "reviews";

export function PackageDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [payload, setPayload] = useState<PackageFullResponse["data"] | null>(
    null
  );
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<PackageTab>("details");

  const [qName, setQName] = useState("");
  const [qEmail, setQEmail] = useState("");
  const [qPhone, setQPhone] = useState("");
  const [qMsg, setQMsg] = useState("");
  const [qSubmitting, setQSubmitting] = useState(false);
  const [qFeedback, setQFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setErr(null);
    setLoading(true);
    apiGet<PackageFullResponse>(`/api/packages/slug/${encodeURIComponent(slug)}`)
      .then((r) => {
        setPayload(r.data);
        setErr(null);
      })
      .catch(() => {
        setErr("Package not found or API error.");
        setPayload(null);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const pkgForMeta = payload?.package;
  usePageMeta(
    pkgForMeta
      ? `${pkgForMeta.packName} | SBM Tour India`
      : "Package | SBM Tour India",
    pkgForMeta?.metaTagDesc
      ? String(pkgForMeta.metaTagDesc).slice(0, 160)
      : undefined
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center text-slate-600">
        Loading package...
      </div>
    );
  }

  if (err || !payload) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-slate-600">{err ?? "Not found."}</p>
        <Link to="/packages" className="mt-4 inline-block text-brand-accent">
          ? Back to packages
        </Link>
      </div>
    );
  }

  const pkg = payload.package;
  const img = legacyMediaUrl("packages", pkg.featured_image);
  const lead = formatInr(pickLeadPrice(pkg));

  const tabs = useMemo(
    () =>
      [
        { id: "details", label: "DETAILS" },
        { id: "itinerary", label: "ITINERARY", hidden: payload.itinerary.length === 0 },
        { id: "inclusions", label: "INCLUSIONS", hidden: payload.inclusions.length === 0 },
        { id: "exclusions", label: "EXCLUSIONS", hidden: payload.exclusions.length === 0 },
        { id: "photos", label: "PHOTOS", hidden: payload.gallery.length === 0 },
        { id: "reviews", label: "REVIEWS" },
      ].filter((t) => !t.hidden) as { id: PackageTab; label: string }[],
    [payload]
  );

  const priceRows = [
    {
      label: "Single",
      p: pickTierPrice(pkg.single_discounted_price, pkg.single_actual_price),
    },
    {
      label: "Twin / double",
      p: pickTierPrice(pkg.dual_discounted_price, pkg.dual_actual_price),
    },
    {
      label: "Triple",
      p: pickTierPrice(pkg.triple_discounted_price, pkg.triple_actual_price),
    },
    {
      label: "Quad",
      p: pickTierPrice(pkg.quad_discounted_price, pkg.quad_actual_price),
    },
  ].filter((r) => r.p != null);

  async function submitQuickEnquiry(e: FormEvent) {
    e.preventDefault();
    setQFeedback(null);
    setQSubmitting(true);
    try {
      await apiPost<{ ok: boolean }>("/api/enquiries", {
        fullName: qName,
        email: qEmail,
        phone: qPhone,
        destination: pkg.destination_name || pkg.country_name,
        requirement: qMsg || `${pkg.packName} (${pkg.packDuration})`,
      });
      setQFeedback("Enquiry submitted. We will contact you shortly.");
      setQName("");
      setQEmail("");
      setQPhone("");
      setQMsg("");
    } catch (e) {
      setQFeedback(e instanceof Error ? e.message : "Could not submit enquiry.");
    } finally {
      setQSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        to="/packages"
        className="text-sm font-medium text-brand-accent hover:underline"
      >
        ? All packages
      </Link>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {img ? (
          <div className="relative">
            <img src={img} alt="" className="aspect-[21/8] min-h-[280px] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-accent">
                {pkg.packType}
              </p>
              <h1 className="mt-1 text-3xl font-extrabold uppercase text-white md:text-5xl">
                {pkg.packName}
              </h1>
            </div>
          </div>
        ) : null}
      </section>

      <div className="mt-4 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              tab === t.id
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 hover:bg-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm text-slate-600">
            {[pkg.destination_name, pkg.country_name].filter(Boolean).join(" � ")} �{" "}
            {pkg.packDuration}
          </p>
          {lead ? (
            <p className="mt-2 text-2xl font-bold text-brand-navy">From {lead}</p>
          ) : null}

          {priceRows.length > 0 ? (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[260px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Occupancy</th>
                    <th className="px-4 py-3 font-semibold">Price (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {priceRows.map((r) => (
                    <tr key={r.label} className="border-t border-slate-100">
                      <td className="px-4 py-3">{r.label}</td>
                      <td className="px-4 py-3 font-semibold text-brand-navy">
                        {formatInr(r.p!)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === "details" ? (
            <div
              className="mt-6 max-w-none space-y-3 text-slate-700 [&_li]:ml-4 [&_p]:mb-3 [&_ul]:list-disc"
              dangerouslySetInnerHTML={sanitizedHtml(pkg.packDesc || pkg.package_desc)}
            />
          ) : null}

          {tab === "itinerary" ? (
            <ol className="mt-6 space-y-6 border-l-2 border-brand-accent/40 pl-6">
              {payload.itinerary.map((day) => (
                <li key={day.itineraryDay} className="relative">
                  <span className="absolute -left-[31px] flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent text-xs font-bold text-brand-navy">
                    {day.itineraryDay}
                  </span>
                  <h3 className="font-semibold text-brand-navy">{day.itineraryHeading}</h3>
                  <div
                    className="mt-2 text-sm leading-relaxed text-slate-600 [&_p]:mb-2"
                    dangerouslySetInnerHTML={sanitizedHtml(day.itineraryDesc)}
                  />
                </li>
              ))}
            </ol>
          ) : null}

          {tab === "inclusions" ? (
            <ul className="mt-6 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
              {payload.inclusions.map((row, i) => (
                <li key={i} className="rounded-lg bg-emerald-50 px-4 py-3">
                  {row.inclusion}
                </li>
              ))}
            </ul>
          ) : null}

          {tab === "exclusions" ? (
            <ul className="mt-6 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
              {payload.exclusions.map((row, i) => (
                <li key={i} className="rounded-lg bg-rose-50 px-4 py-3">
                  {row.exclusion}
                </li>
              ))}
            </ul>
          ) : null}

          {tab === "photos" ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {payload.gallery.map((g, idx) => {
                const url = legacyMediaUrl("packages/gallery", g.image_file);
                return url ? (
                  <a
                    key={`${g.image_file}-${idx}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="overflow-hidden rounded-lg bg-slate-100"
                  >
                    <img src={url} alt="" className="aspect-square w-full object-cover" />
                  </a>
                ) : null;
              })}
            </div>
          ) : null}

          {tab === "reviews" ? (
            <div className="mt-6 space-y-4">
              {payload.reviews.length === 0 ? (
                <p className="text-sm text-slate-500">No reviews yet for this package.</p>
              ) : (
                payload.reviews.map((r) => (
                  <article key={r.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-brand-navy">{r.reviewer_name}</p>
                      <p className="text-xs text-slate-500">{String(r.created_at || "")}</p>
                    </div>
                    <p className="mt-1 text-sm text-amber-600">
                      {"?".repeat(
                        Math.max(1, Math.min(5, Math.round(Number(r.rating) || 0)))
                      )}
                    </p>
                    <p className="mt-2 text-sm text-slate-700">{r.rating_desc || "?"}</p>
                  </article>
                ))
              )}
            </div>
          ) : null}
        </section>

        <aside className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-24">
          <div className="bg-orange-500 px-5 py-3 text-center text-sm font-bold tracking-wide text-white">
            Call Us: +91-9571718500
          </div>
          <div className="border-b border-slate-200 bg-amber-200 px-5 py-4 text-center text-4xl font-extrabold text-brand-navy">
            Enquire Now
          </div>
          <form onSubmit={submitQuickEnquiry} className="space-y-3 p-5">
            <input
              required
              value={qName}
              onChange={(e) => setQName(e.target.value)}
              placeholder="Name"
              className="w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
            />
            <input
              required
              type="email"
              value={qEmail}
              onChange={(e) => setQEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
            />
            <input
              required
              value={qPhone}
              onChange={(e) => setQPhone(e.target.value)}
              placeholder="Phone"
              className="w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
            />
            <textarea
              value={qMsg}
              onChange={(e) => setQMsg(e.target.value)}
              placeholder="Message"
              className="min-h-24 w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
            />
            {qFeedback ? <p className="text-xs text-slate-600">{qFeedback}</p> : null}
            <button
              type="submit"
              disabled={qSubmitting}
              className="w-full rounded bg-brand-accent px-4 py-2.5 text-sm font-bold text-brand-navy disabled:opacity-60"
            >
              {qSubmitting ? "Submitting..." : "Submit Enquiry"}
            </button>
          </form>
        </aside>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-brand-navy">Similar packages</h2>
        {payload.similar.length === 0 ? (
          <p className="mt-4 text-slate-500">No similar packages found.</p>
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {payload.similar.map((p) => {
              const simImg = legacyMediaUrl("packages", p.featured_image);
              return (
                <article
                  key={p.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <Link to={`/packages/${p.package_slug}`} className="block">
                    {simImg ? (
                      <img
                        src={simImg}
                        alt=""
                        className="aspect-[16/10] w-full object-cover"
                      />
                    ) : (
                      <div className="aspect-[16/10] bg-slate-100" />
                    )}
                  </Link>
                  <div className="p-4">
                    <p className="text-xs text-brand-accent">{p.packType}</p>
                    <Link
                      to={`/packages/${p.package_slug}`}
                      className="mt-1 block font-semibold text-brand-navy hover:text-brand-accent"
                    >
                      {p.packName}
                    </Link>
                    <p className="mt-1 text-sm text-slate-600">
                      {[p.destination_name, p.country_name].filter(Boolean).join(" � ")} �{" "}
                      {p.packDuration}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-brand-navy">
                      {formatInr(pickLeadPrice(p)) || "Contact us for pricing"}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
