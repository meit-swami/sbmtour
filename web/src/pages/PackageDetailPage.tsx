import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Calendar,
  Check,
  Clock,
  Heart,
  Mail,
  MapPin,
  Phone,
  Send,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  X as XIcon,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { legacyMediaUrl } from "@/lib/media";
import { pickLeadPrice, pickTierPrice } from "@/lib/pricing";
import { sanitizedHtml } from "@/lib/sanitizeHtml";
import { cn } from "@/lib/utils";
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

type Tab = "details" | "itinerary" | "inclusions" | "exclusions" | "photos" | "reviews";

export function PackageDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [payload, setPayload] = useState<PackageFullResponse["data"] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [tab, setTab] = useState<Tab>("details");
  const [wished, setWished] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setErr(null);
    apiGet<PackageFullResponse>(`/api/packages/slug/${encodeURIComponent(slug)}`)
      .then((r) => setPayload(r.data))
      .catch(() => setErr("Package not found."))
      .finally(() => setLoading(false));
  }, [slug]);

  const pkgForMeta = payload?.package;
  usePageMeta(
    pkgForMeta ? `${pkgForMeta.packName} | SBM Tour India` : "Package | SBM Tour India",
    pkgForMeta?.metaTagDesc ? String(pkgForMeta.metaTagDesc).slice(0, 160) : undefined
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 pb-24 pt-28 lg:px-8">
        <div className="h-[420px] animate-pulse rounded-3xl bg-secondary" />
      </div>
    );
  }

  if (err || !payload) {
    return (
      <div className="container mx-auto px-4 pb-24 pt-28 text-center lg:px-8">
        <p className="text-muted-foreground">{err ?? "Not found."}</p>
        <Link to="/packages" className="mt-4 inline-block font-semibold text-primary">
          ← Back to packages
        </Link>
      </div>
    );
  }

  const pkg = payload.package;
  const gallery = payload.gallery
    .map((g) => legacyMediaUrl("packages/gallery", g.image_file))
    .filter(Boolean) as string[];
  const heroImg = legacyMediaUrl("packages", pkg.featured_image);
  const allImages = heroImg ? [heroImg, ...gallery] : gallery;
  const currentImg = allImages[activeImg] ?? heroImg;

  const lead = pickLeadPrice(pkg);
  const leadDisplay = formatINR(lead);

  const priceRows = [
    { label: "Single", p: pickTierPrice(pkg.single_discounted_price, pkg.single_actual_price) },
    { label: "Twin / double", p: pickTierPrice(pkg.dual_discounted_price, pkg.dual_actual_price) },
    { label: "Triple", p: pickTierPrice(pkg.triple_discounted_price, pkg.triple_actual_price) },
    { label: "Quad", p: pickTierPrice(pkg.quad_discounted_price, pkg.quad_actual_price) },
  ].filter((r) => r.p != null);

  const tabs: { id: Tab; label: string; hidden?: boolean }[] = [
    { id: "details", label: "Overview" },
    { id: "itinerary", label: "Itinerary", hidden: payload.itinerary.length === 0 },
    { id: "inclusions", label: "Inclusions", hidden: payload.inclusions.length === 0 },
    { id: "exclusions", label: "Exclusions", hidden: payload.exclusions.length === 0 },
    { id: "photos", label: "Photos", hidden: gallery.length === 0 },
    { id: "reviews", label: "Reviews" },
  ];
  const visibleTabs = tabs.filter((t) => !t.hidden);

  return (
    <div className="pb-32 lg:pb-12">
      <section className="container mx-auto px-4 pt-24 lg:px-8">
        <div className="grid gap-3 overflow-hidden rounded-3xl lg:grid-cols-[2fr_1fr]">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted lg:aspect-auto lg:h-[480px]">
            {currentImg ? (
              <img
                src={currentImg}
                alt={pkg.packName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl opacity-30">
                🗺️
              </div>
            )}
            <span className="absolute left-4 top-4 inline-flex rounded-full bg-cta px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cta-foreground shadow-cta">
              {pkg.packType}
            </span>
          </div>
          {allImages.length > 1 ? (
            <div className="hidden grid-rows-2 gap-3 lg:grid">
              {allImages.slice(1, 3).map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImg(i + 1)}
                  className="relative h-full overflow-hidden rounded-2xl bg-muted"
                >
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {allImages.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {allImages.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setActiveImg(i)}
                className={cn(
                  "h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2",
                  activeImg === i ? "border-primary" : "border-transparent"
                )}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="container mx-auto grid gap-10 px-4 py-8 lg:grid-cols-[1fr_360px] lg:px-8">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {[pkg.destination_name, pkg.country_name].filter(Boolean).join(", ")}
              </div>
              <h1 className="mt-2 font-display text-3xl font-bold leading-tight md:text-4xl">
                {pkg.packName}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Star className="h-4 w-4 fill-gold text-gold" /> 4.8
                  <span className="font-normal text-muted-foreground">
                    ({payload.reviews.length} reviews)
                  </span>
                </span>
                {pkg.packDuration ? (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" /> {pkg.packDuration}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" /> Year-round
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setWished((w) => !w)}
                aria-label="Save"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary"
              >
                <Heart
                  className={cn(
                    "h-5 w-5",
                    wished ? "fill-cta text-cta" : "text-foreground"
                  )}
                />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== "undefined") {
                    void navigator.clipboard?.writeText(window.location.href);
                  }
                }}
                aria-label="Share"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {priceRows.length > 0 ? (
            <div className="mt-6 overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Occupancy</th>
                    <th className="px-4 py-3 font-semibold">Price (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {priceRows.map((r) => (
                    <tr key={r.label} className="border-t border-border">
                      <td className="px-4 py-3">{r.label}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {formatINR(r.p!)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {/* Tabs */}
          <div className="mt-8 overflow-x-auto">
            <div className="inline-flex min-w-full gap-2 rounded-2xl bg-secondary p-1">
              {visibleTabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "rounded-xl px-4 py-2 text-sm font-semibold transition",
                    tab === t.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            {tab === "details" ? (
              <div
                className="space-y-3 leading-relaxed text-foreground/85 [&_li]:ml-4 [&_p]:mb-3 [&_ul]:list-disc"
                dangerouslySetInnerHTML={sanitizedHtml(pkg.packDesc || pkg.package_desc)}
              />
            ) : null}

            {tab === "itinerary" ? (
              <ol className="space-y-3">
                {payload.itinerary.map((day) => (
                  <li
                    key={day.itineraryDay}
                    className="rounded-2xl border border-border bg-card p-5"
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-ocean font-display text-sm font-bold text-primary-foreground">
                        {day.itineraryDay}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-display font-semibold">
                          {day.itineraryHeading}
                        </h3>
                        <div
                          className="mt-2 text-sm leading-relaxed text-muted-foreground [&_p]:mb-2"
                          dangerouslySetInnerHTML={sanitizedHtml(day.itineraryDesc)}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : null}

            {tab === "inclusions" ? (
              <ul className="grid gap-3 md:grid-cols-2">
                {payload.inclusions.map((row, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-xl bg-forest/10 px-4 py-3 text-sm text-foreground"
                  >
                    <Check className="h-5 w-5 shrink-0 text-forest" /> {row.inclusion}
                  </li>
                ))}
              </ul>
            ) : null}

            {tab === "exclusions" ? (
              <ul className="grid gap-3 md:grid-cols-2">
                {payload.exclusions.map((row, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-foreground"
                  >
                    <XIcon className="h-5 w-5 shrink-0 text-destructive" /> {row.exclusion}
                  </li>
                ))}
              </ul>
            ) : null}

            {tab === "photos" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {gallery.map((url, idx) => (
                  <a
                    key={`${url}-${idx}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="overflow-hidden rounded-xl bg-muted"
                  >
                    <img
                      src={url}
                      alt=""
                      className="aspect-square w-full object-cover transition-transform hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            ) : null}

            {tab === "reviews" ? (
              <div className="space-y-4">
                {payload.reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No reviews yet for this package.
                  </p>
                ) : (
                  payload.reviews.map((r) => {
                    const ratingNum = Math.max(
                      1,
                      Math.min(5, Math.round(Number(r.rating) || 0))
                    );
                    return (
                      <article
                        key={r.id}
                        className="rounded-xl border border-border bg-card p-5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                            {r.reviewer_name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {r.reviewer_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {String(r.created_at || "")}
                            </p>
                          </div>
                          <div className="ml-auto flex items-center gap-1 text-gold">
                            {Array.from({ length: ratingNum }).map((_, k) => (
                              <Star key={k} className="h-4 w-4 fill-gold" />
                            ))}
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-foreground/85">
                          {r.rating_desc || "—"}
                        </p>
                      </article>
                    );
                  })
                )}
              </div>
            ) : null}
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <BookingCard
              packageName={pkg.packName}
              destination={pkg.destination_name || pkg.country_name}
              duration={pkg.packDuration}
              leadDisplay={leadDisplay}
            />
            <div className="mt-4 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-semibold text-forest">
                <ShieldCheck className="h-4 w-4" /> Free cancellation up to 7 days
              </div>
              <div className="mt-1">Lock in today's price with ₹0 deposit.</div>
            </div>
          </div>
        </aside>
      </section>

      {payload.similar.length > 0 ? (
        <section className="container mx-auto px-4 lg:px-8">
          <h2 className="mb-6 font-display text-2xl font-bold">You may also like</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {payload.similar.map((p) => {
              const img = legacyMediaUrl("packages", p.featured_image);
              return (
                <article
                  key={p.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft hover-lift"
                >
                  <Link to={`/packages/${p.package_slug}`} className="group block">
                    <div className="aspect-[16/10] overflow-hidden bg-muted">
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          className="img-zoom h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                  </Link>
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-cta">
                      {p.packType}
                    </p>
                    <Link
                      to={`/packages/${p.package_slug}`}
                      className="mt-1 block font-display font-semibold transition-colors hover:text-primary"
                    >
                      {p.packName}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[p.destination_name, p.country_name].filter(Boolean).join(" · ")} · {p.packDuration}
                    </p>
                    <p className="mt-2 font-display text-sm font-semibold">
                      {formatINR(pickLeadPrice(p)) || "Ask for quote"}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Mobile sticky booking bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border bg-background/95 p-3 backdrop-blur lg:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div>
          {leadDisplay ? (
            <div className="font-display text-lg font-bold">{leadDisplay}</div>
          ) : (
            <div className="text-sm text-muted-foreground">Ask for quote</div>
          )}
          <div className="text-xs text-muted-foreground">per person</div>
        </div>
        <a
          href="#enquire"
          className="ml-auto inline-flex items-center justify-center rounded-lg bg-cta px-6 py-3 font-semibold text-cta-foreground shadow-cta"
        >
          Enquire
        </a>
      </div>

      <section id="enquire" className="container mx-auto px-4 py-16 lg:px-8">
        <div className="grid overflow-hidden rounded-3xl border border-border bg-card shadow-card lg:grid-cols-[1.1fr_1fr]">
          <div className="relative gradient-ocean p-8 text-primary-foreground md:p-12">
            <div className="absolute inset-0 opacity-20 mix-blend-overlay">
              <img
                src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1400&q=80"
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> Talk to a trip expert
              </span>
              <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight md:text-4xl">
                Plan {pkg.packName} for you
              </h2>
              <p className="mt-3 max-w-md text-primary-foreground/90">
                Share a few details and we'll craft a personalised quote with the best price — usually within 24 hours.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-primary-foreground/90">
                <li>✓ Free, no-obligation quote</li>
                <li>✓ Handcrafted by local experts</li>
                <li>✓ Best-price guarantee</li>
              </ul>
            </div>
          </div>
          <div className="p-6 md:p-10">
            <QuickEnquiry
              defaultDestination={pkg.destination_name || pkg.country_name}
              defaultMessage={`${pkg.packName} (${pkg.packDuration})`}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function BookingCard({
  packageName,
  destination,
  duration,
  leadDisplay,
}: {
  packageName: string;
  destination: string;
  duration: string;
  leadDisplay: string | null;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-end gap-2">
        {leadDisplay ? (
          <>
            <span className="font-display text-3xl font-bold">{leadDisplay}</span>
            <span className="text-sm text-muted-foreground">/ person</span>
          </>
        ) : (
          <span className="font-display text-xl">Custom pricing</span>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground">Date</span>
          <input
            type="date"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-muted-foreground">Travelers</span>
          <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>
      <a
        href="#enquire"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cta px-4 py-3 font-semibold text-cta-foreground shadow-cta hover:bg-cta/90"
      >
        Enquire now
      </a>
      <Link
        to="/plan-trip"
        className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-border px-4 py-3 font-semibold hover:bg-secondary"
      >
        Plan with expert
      </Link>
      <div className="mt-4 text-center text-xs text-muted-foreground">
        No payment charged today · {duration} · {destination}
      </div>
      <div className="sr-only">{packageName}</div>
    </div>
  );
}

function QuickEnquiry({
  defaultDestination,
  defaultMessage,
}: {
  defaultDestination: string;
  defaultMessage: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(defaultMessage);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setSubmitting(true);
    try {
      await apiPost("/api/enquiries", {
        fullName: name,
        email,
        phone,
        destination: defaultDestination,
        requirement: message || undefined,
      });
      setFeedback({
        ok: true,
        text: "Enquiry submitted. We'll contact you shortly.",
      });
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err) {
      setFeedback({
        ok: false,
        text: err instanceof Error ? err.message : "Failed to send.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <h3 className="font-display text-xl font-bold">Get a free quote</h3>
      <div className="relative">
        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div className="relative">
        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div className="relative">
        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone / WhatsApp"
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <textarea
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Any preferences, travel dates or group size?"
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
      />
      {feedback ? (
        <p className={feedback.ok ? "text-sm text-forest" : "text-sm text-destructive"}>
          {feedback.text}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-cta px-4 py-3 font-semibold text-cta-foreground shadow-cta hover:bg-cta/90 disabled:opacity-60"
      >
        {submitting ? (
          "Sending…"
        ) : (
          <>
            <Send className="h-4 w-4" /> Submit enquiry
          </>
        )}
      </button>
    </form>
  );
}
