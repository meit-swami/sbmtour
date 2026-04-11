import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { pickLeadPrice } from "@/lib/pricing";
import { sanitizedHtml } from "@/lib/sanitizeHtml";
import { formatInr, stripHtml } from "@/lib/text";
import { usePageMeta } from "@/hooks/usePageMeta";
import type {
  BannerRow,
  BlogRow,
  DestinationRow,
  HomePayload,
  ReviewRow,
} from "@/types/home";

type Health = { ok: boolean; db: string };

function bannerVisuals(b: BannerRow): {
  kind: "video" | "image";
  desktop?: string;
  mobile?: string;
} {
  if (b.media_type === "video") {
    return {
      kind: "video",
      desktop: legacyMediaUrl("banner", b.desktop_video),
      mobile: legacyMediaUrl("banner", b.mobile_video) ?? legacyMediaUrl("banner", b.desktop_video),
    };
  }
  const desktop =
    legacyMediaUrl("banner", b.desktop_image) ??
    legacyMediaUrl("banner", b.banner_image);
  const mobile =
    legacyMediaUrl("banner", b.mobile_image) ?? desktop;
  return { kind: "image", desktop, mobile };
}

export function HomePage() {
  usePageMeta(
    "SBM Tour India",
    "Domestic & international tour packages, destinations, hotels & vehicles."
  );
  const [health, setHealth] = useState<string>("checking…");
  const [home, setHome] = useState<HomePayload | null>(null);
  const [homeErr, setHomeErr] = useState<string | null>(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const [packTab, setPackTab] = useState<"Domestic" | "International">(
    "Domestic"
  );

  const [destinationTypes, setDestinationTypes] = useState<string[]>([]);
  const [activeDestType, setActiveDestType] = useState<string>("");
  const [destinations, setDestinations] = useState<DestinationRow[]>([]);
  const [destLoading, setDestLoading] = useState(false);

  const [enqName, setEnqName] = useState("");
  const [enqEmail, setEnqEmail] = useState("");
  const [enqPhone, setEnqPhone] = useState("");
  const [enqTrip, setEnqTrip] = useState("");
  const [enqSubmitting, setEnqSubmitting] = useState(false);
  const [enqFeedback, setEnqFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [tripOpen, setTripOpen] = useState(true);
  const [tripSubmitting, setTripSubmitting] = useState(false);
  const [tripName, setTripName] = useState("");
  const [tripPhone, setTripPhone] = useState("");
  const [tripEmail, setTripEmail] = useState("");
  const [tripTravellers, setTripTravellers] = useState("");
  const [tripMode, setTripMode] = useState("");
  const [tripBudget, setTripBudget] = useState("");
  const [tripDestination, setTripDestination] = useState("");
  const [tripDays, setTripDays] = useState("");
  const [tripRequirements, setTripRequirements] = useState("");

  useEffect(() => {
    apiGet<Health>("/api/health")
      .then((h) => {
        setHealth(h.db === "up" ? "API + DB connected" : "API up, DB down");
      })
      .catch(() => setHealth("API unreachable (start api on :4000)"));
  }, []);

  const loadHome = useCallback(async () => {
    try {
      const r = await apiGet<{ data: HomePayload }>("/api/home");
      setHome(r.data);
      setDestinationTypes(r.data.destinationTypes);
      setHomeErr(null);
    } catch {
      setHomeErr("Could not load homepage data. Check API and MySQL.");
    }
  }, []);

  useEffect(() => {
    void loadHome();
    const retry = window.setInterval(() => {
      void loadHome();
    }, 15000);
    return () => window.clearInterval(retry);
  }, [loadHome]);

  const defaultDestType = useMemo(() => {
    if (destinationTypes.includes("Featured Destinations")) {
      return "Featured Destinations";
    }
    return destinationTypes[0] ?? "";
  }, [destinationTypes]);

  useEffect(() => {
    if (!defaultDestType) return;
    setActiveDestType((prev) => (prev === "" ? defaultDestType : prev));
  }, [defaultDestType]);

  const loadDestinations = useCallback(async (t: string) => {
    if (!t) return;
    setDestLoading(true);
    try {
      const r = await apiGet<{ data: DestinationRow[] }>(
        `/api/destinations?${new URLSearchParams({
          destination_type: t,
          limit: "9",
        })}`
      );
      setDestinations(r.data);
    } catch {
      setDestinations([]);
    } finally {
      setDestLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeDestType) void loadDestinations(activeDestType);
  }, [activeDestType, loadDestinations]);

  const banners = home?.banners ?? [];
  const packages =
    packTab === "Domestic"
      ? (home?.packagesDomestic ?? [])
      : (home?.packagesInternational ?? []);

  async function submitEnquiry(e: FormEvent) {
    e.preventDefault();
    setEnqFeedback(null);
    setEnqSubmitting(true);
    try {
      await apiPost<{ ok: boolean }>("/api/enquiries", {
        fullName: enqName,
        email: enqEmail,
        phone: enqPhone,
        requirement: enqTrip || undefined,
      });
      setEnqFeedback({ type: "ok", text: "Thanks — we’ll get back to you soon." });
      setEnqName("");
      setEnqEmail("");
      setEnqPhone("");
      setEnqTrip("");
    } catch (err) {
      setEnqFeedback({
        type: "err",
        text: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setEnqSubmitting(false);
    }
  }

  async function submitTripPlanner(e: FormEvent) {
    e.preventDefault();
    setTripSubmitting(true);
    try {
      const extras = [
        tripTravellers ? `Travellers: ${tripTravellers}` : "",
        tripMode ? `Travel mode: ${tripMode}` : "",
        tripBudget ? `Budget per person: ${tripBudget}` : "",
        tripDays ? `Number of days: ${tripDays}` : "",
        tripRequirements ? `Additional requirements: ${tripRequirements}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      await apiPost<{ ok: boolean }>("/api/enquiries", {
        fullName: tripName,
        email: tripEmail,
        phone: tripPhone,
        destination: tripDestination || undefined,
        days: tripDays || undefined,
        budget: tripBudget || undefined,
        transport: tripMode || undefined,
        requirement: extras || undefined,
      });
      setTripOpen(false);
    } catch (err) {
      setEnqFeedback({
        type: "err",
        text: err instanceof Error ? err.message : "Could not submit trip plan.",
      });
    } finally {
      setTripSubmitting(false);
    }
  }

  return (
    <>
      {tripOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/75 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-brand-accent px-5 py-4 text-brand-navy">
              <h3 className="text-xl font-extrabold">Plan Your Perfect Trip</h3>
              <button
                type="button"
                onClick={() => setTripOpen(false)}
                className="text-2xl leading-none text-brand-navy/70 hover:text-brand-navy"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={submitTripPlanner} className="grid gap-4 p-5 md:grid-cols-2">
              <input required value={tripName} onChange={(e) => setTripName(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Full Name *" />
              <input required value={tripPhone} onChange={(e) => setTripPhone(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Phone Number *" />
              <input required type="email" value={tripEmail} onChange={(e) => setTripEmail(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Email Address *" />
              <input required value={tripTravellers} onChange={(e) => setTripTravellers(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Number of Travellers *" />
              <select required value={tripMode} onChange={(e) => setTripMode(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
                <option value="">Select Travel Mode *</option>
                <option value="flight">Flight</option>
                <option value="train">Train</option>
                <option value="car">Car</option>
                <option value="bus">Bus</option>
              </select>
              <input required value={tripBudget} onChange={(e) => setTripBudget(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Budget Per Person (INR) *" />
              <input value={tripDestination} onChange={(e) => setTripDestination(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Destination" />
              <input value={tripDays} onChange={(e) => setTripDays(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" placeholder="Number of Days" />
              <textarea value={tripRequirements} onChange={(e) => setTripRequirements(e.target.value)} className="md:col-span-2 min-h-24 rounded-lg border border-slate-300 px-3 py-2" placeholder="Additional Requirements" />
              <div className="md:col-span-2 flex justify-end gap-3">
                <button type="button" onClick={() => setTripOpen(false)} className="rounded-lg bg-slate-200 px-5 py-2 font-semibold text-slate-700">Close</button>
                <button type="submit" disabled={tripSubmitting} className="rounded-lg bg-brand-accent px-5 py-2 font-semibold text-brand-navy disabled:opacity-60">
                  {tripSubmitting ? "Submitting..." : "Submit Enquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {banners.length > 0 ? (
        <section className="relative bg-brand-navy pb-8 text-white">
          <div className="relative aspect-[21/9] min-h-[280px] w-full overflow-hidden md:min-h-[360px]">
            {banners.map((b, i) => {
              const v = bannerVisuals(b);
              const show = i === activeBanner;
              if (!show) return null;
              if (v.kind === "video" && v.desktop) {
                return (
                  <video
                    key={b.id}
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    src={v.desktop}
                  />
                );
              }
              if (v.desktop) {
                return (
                  <img
                    key={b.id}
                    src={v.desktop}
                    alt={b.banner_title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                );
              }
              return (
                <div
                  key={b.id}
                  className="absolute inset-0 bg-gradient-to-br from-brand-navy-light to-brand-navy"
                />
              );
            })}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end px-4 pb-10 md:px-8">
              <div className="mx-auto w-full max-w-6xl">
                <h1 className="max-w-2xl text-3xl font-bold drop-shadow md:text-5xl">
                  {banners[activeBanner]?.banner_title}
                </h1>
                {banners[activeBanner]?.banner_desc ? (
                  <p
                    className="mt-3 max-w-xl text-sm text-slate-200 line-clamp-2 md:text-base"
                    dangerouslySetInnerHTML={sanitizedHtml(
                      banners[activeBanner].banner_desc
                    )}
                  />
                ) : null}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/packages"
                    className="inline-flex rounded-lg bg-brand-accent px-6 py-3 font-semibold text-brand-navy shadow-lg transition hover:bg-brand-accent-hover"
                  >
                    Explore packages
                  </Link>
                  <Link
                    to="/contact"
                    className="inline-flex rounded-lg border border-white/40 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                  >
                    Plan a trip
                  </Link>
                </div>
              </div>
            </div>
          </div>
          {banners.length > 1 ? (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  aria-label={`Banner ${i + 1}`}
                  className={`h-2 w-2 rounded-full transition ${
                    i === activeBanner ? "bg-brand-accent" : "bg-white/40"
                  }`}
                  onClick={() => setActiveBanner(i)}
                />
              ))}
            </div>
          ) : null}
          <p className="absolute right-4 top-4 text-xs text-slate-400">
            {health}
          </p>
        </section>
      ) : (
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-navy text-white">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -right-20 top-0 h-96 w-96 rounded-full bg-brand-accent blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
            <p className="text-sm font-medium uppercase tracking-widest text-brand-accent">
              Discover India & beyond
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight md:text-5xl">
              Your next adventure starts here
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-300">
              Add active rows in{" "}
              <code className="rounded bg-white/10 px-1 text-sm">tbl_banner</code>{" "}
              or connect the database to see the hero carousel.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/packages"
                className="inline-flex items-center rounded-lg bg-brand-accent px-6 py-3 font-semibold text-brand-navy shadow-lg transition hover:bg-brand-accent-hover"
              >
                Explore packages
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center rounded-lg border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Plan a trip
              </Link>
            </div>
            <p className="mt-6 text-xs text-slate-400">
              Dev: <span className="text-brand-accent">{health}</span>
            </p>
          </div>
        </section>
      )}

      {homeErr ? (
        <div className="bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          {homeErr}
        </div>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-brand-navy">
              Popular destinations
            </h2>
            <p className="mt-1 text-slate-600">
              Filter by category — data from{" "}
              <code className="text-xs">tbl_destination</code>.
            </p>
          </div>
          <Link
            to="/destinations"
            className="text-sm font-semibold text-brand-accent hover:text-brand-accent-hover"
          >
            View all →
          </Link>
        </div>

        {destinationTypes.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {destinationTypes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveDestType(t)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  t === activeDestType
                    ? "bg-brand-navy text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destLoading ? (
            <p className="col-span-full text-center text-slate-500">
              Loading destinations…
            </p>
          ) : (
            destinations.map((d) => (
              <Link
                key={d.id}
                to={`/destinations/${d.destination_slug}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={
                      legacyMediaUrl("destination", d.destination_image) ??
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"
                    }
                    alt={d.destination_name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-brand-accent">
                    {d.country_name}
                  </p>
                  <h3 className="mt-1 font-semibold text-brand-navy group-hover:text-brand-accent">
                    {d.destination_name}
                  </h3>
                </div>
              </Link>
            ))
          )}
        </div>
        {!destLoading && destinations.length === 0 && activeDestType ? (
          <p className="mt-8 text-center text-slate-500">
            No destinations in this category.
          </p>
        ) : null}
      </section>

      <section className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <h2 className="text-2xl font-bold text-brand-navy">
              Top selling packages
            </h2>
            <div className="flex rounded-lg bg-slate-100 p-1 text-sm font-medium">
              {(["Domestic", "International"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPackTab(tab)}
                  className={`rounded-md px-4 py-2 transition ${
                    packTab === tab
                      ? "bg-white text-brand-navy shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {packages.map((p) => {
              const thumb = legacyMediaUrl("packages", p.featured_image);
              return (
              <article
                key={p.id}
                className="flex gap-4 rounded-2xl border border-slate-200 p-4 shadow-sm"
              >
                <Link
                  to={`/packages/${p.package_slug}`}
                  className="flex h-28 w-36 shrink-0 overflow-hidden rounded-xl bg-slate-100"
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-2">
                    {p.is_featured ? (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        Featured
                      </span>
                    ) : null}
                    {p.today_deal ? (
                      <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">
                        Deal
                      </span>
                    ) : null}
                    <span className="text-xs text-slate-500">{p.packType}</span>
                  </div>
                  <Link
                    to={`/packages/${p.package_slug}`}
                    className="mt-1 font-semibold text-brand-navy hover:text-brand-accent"
                  >
                    {p.packName}
                  </Link>
                  <p className="text-sm text-slate-600">
                    {[p.destination_name, p.country_name]
                      .filter(Boolean)
                      .join(" · ") || p.country_name}
                    {" · "}
                    {p.packDuration}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {formatInr(pickLeadPrice(p)) ? (
                      <span className="text-lg font-bold text-brand-navy">
                        from {formatInr(pickLeadPrice(p))}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">
                        Ask for quote
                      </span>
                    )}
                    <Link
                      to={`/packages/${p.package_slug}`}
                      className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-accent-hover"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </article>
            );
            })}
          </div>
          {packages.length === 0 ? (
            <p className="mt-8 text-center text-slate-500">
              No packages in this tab.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-brand-navy">
          What travellers say
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {(home?.reviews ?? []).map((r: ReviewRow) => (
            <blockquote
              key={r.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <img
                  src={
                    legacyMediaUrl("review", r.review_image) ?? undefined
                  }
                  alt=""
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <cite className="not-italic font-semibold text-brand-navy">
                    {r.reviewer_name}
                  </cite>
                  <p className="text-xs text-slate-500">{r.reviewer_place}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 line-clamp-6">
                {r.review_desc}
              </p>
            </blockquote>
          ))}
        </div>
        {(home?.reviews ?? []).length === 0 ? (
          <p className="mt-8 text-center text-slate-500">
            No testimonials yet.
          </p>
        ) : null}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-2xl font-bold text-brand-navy">
          Latest stories
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {(home?.blogs ?? []).map((b: BlogRow) => (
            <article
              key={b.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <Link to={`/blog/${b.blog_slug}`}>
                <img
                  src={legacyMediaUrl("blogs", b.blog_image) ?? undefined}
                  alt=""
                  className="aspect-video w-full object-cover"
                />
              </Link>
              <div className="p-4">
                <time className="text-xs text-slate-500">{b.blogDate}</time>
                <Link to={`/blog/${b.blog_slug}`}>
                  <h3 className="mt-1 font-semibold text-brand-navy hover:text-brand-accent">
                    {b.blog_name || b.blogPlace || "Blog"}
                  </h3>
                </Link>
                <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                  {stripHtml(b.blogDesc, 140)}
                </p>
                <Link
                  to={`/blog/${b.blog_slug}`}
                  className="mt-3 inline-block text-sm font-semibold text-brand-accent"
                >
                  Read more
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-brand-navy py-16 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold">Ready for your next adventure?</h2>
          <p className="mt-2 max-w-xl text-slate-300">
            Submits to <code className="rounded bg-white/10 px-1 text-sm">contactform</code>{" "}
            via <code className="rounded bg-white/10 px-1 text-sm">POST /api/enquiries</code>
            . Progressive multi-step save can be added later.
          </p>
          {enqFeedback ? (
            <p
              className={`mt-4 text-sm font-medium ${
                enqFeedback.type === "ok" ? "text-emerald-300" : "text-rose-300"
              }`}
            >
              {enqFeedback.text}
            </p>
          ) : null}
          <form
            onSubmit={submitEnquiry}
            className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <input
              required
              value={enqName}
              onChange={(e) => setEnqName(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 placeholder:text-slate-400"
              placeholder="Full name"
            />
            <input
              required
              type="email"
              value={enqEmail}
              onChange={(e) => setEnqEmail(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 placeholder:text-slate-400"
              placeholder="Email"
            />
            <input
              required
              value={enqPhone}
              onChange={(e) => setEnqPhone(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 placeholder:text-slate-400"
              placeholder="Mobile"
            />
            <input
              value={enqTrip}
              onChange={(e) => setEnqTrip(e.target.value)}
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 placeholder:text-slate-400"
              placeholder="Trip idea (optional)"
            />
            <div className="sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                disabled={enqSubmitting}
                className="rounded-lg bg-brand-accent px-8 py-3 font-semibold text-brand-navy hover:bg-brand-accent-hover disabled:opacity-60"
              >
                {enqSubmitting ? "Sending…" : "Submit enquiry"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
