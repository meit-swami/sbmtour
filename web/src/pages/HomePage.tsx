import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  ChevronLeft,
  ChevronRight,
  HeadphonesIcon,
  Heart,
  Landmark,
  Mountain,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Users,
  Waves,
} from "lucide-react";
import { AiTourChat } from "@/components/site/AiTourChat";
import { PackageCard } from "@/components/site/PackageCard";
import { PopularDestinations } from "@/components/site/PopularDestinations";
import { SearchBar } from "@/components/site/SearchBar";
import { apiGet } from "@/lib/api";
import { legacyMediaUrl } from "@/lib/media";
import { sanitizedHtml } from "@/lib/sanitizeHtml";
import { stripHtml } from "@/lib/text";
import { usePageMeta } from "@/hooks/usePageMeta";
import type {
  BannerRow,
  BlogRow,
  HomePayload,
  PackageRow,
  ReviewRow,
} from "@/types/home";

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2000&q=80";

function bannerSrc(b: BannerRow): { kind: "image" | "video"; src?: string } {
  if (b.media_type === "video") {
    return { kind: "video", src: legacyMediaUrl("banner", b.desktop_video) };
  }
  const src =
    legacyMediaUrl("banner", b.desktop_image) ??
    legacyMediaUrl("banner", b.banner_image);
  return { kind: "image", src };
}

export function HomePage() {
  usePageMeta(
    "SBM Tour India — Discover Your Next Adventure",
    "Curated tours and travel experiences across India and the world. Honeymoon, adventure, family and luxury packages."
  );

  const [home, setHome] = useState<HomePayload | null>(null);
  const [homeErr, setHomeErr] = useState<string | null>(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const [packTab, setPackTab] = useState<"Domestic" | "International">("Domestic");

  const loadHome = useCallback(async () => {
    try {
      const r = await apiGet<{ data: HomePayload }>("/api/home");
      setHome(r.data);
      setHomeErr(null);
    } catch {
      setHomeErr("Could not load homepage data. Check API and database.");
    }
  }, []);

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  const banners = home?.banners ?? [];
  const packages =
    packTab === "Domestic"
      ? home?.packagesDomestic ?? []
      : home?.packagesInternational ?? [];

  return (
    <>
      <Hero banners={banners} activeBanner={activeBanner} setActiveBanner={setActiveBanner} />

      {homeErr ? (
        <div className="bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          {homeErr}
        </div>
      ) : null}

      <PopularDestinations types={home?.destinationTypes} />

      <PackagesSection
        packTab={packTab}
        setPackTab={setPackTab}
        packages={packages}
      />

      <Categories />

      <WhyChooseUs />

      <OfferBanner />

      <Testimonials reviews={home?.reviews ?? []} />

      <LatestBlog blogs={home?.blogs ?? []} />
    </>
  );
}

/* ---------------- Sections ---------------- */

function Hero({
  banners,
  activeBanner,
  setActiveBanner,
}: {
  banners: BannerRow[];
  activeBanner: number;
  setActiveBanner: (i: number) => void;
}) {
  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const id = window.setInterval(() => {
      setActiveBanner((activeBanner + 1) % banners.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [banners.length, activeBanner, setActiveBanner]);

  const current = banners[activeBanner];
  const visual = current ? bannerSrc(current) : null;

  return (
    <section className="relative flex min-h-[100svh] items-center">
      <div className="absolute inset-0">
        {current && visual?.kind === "video" && visual.src ? (
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            src={visual.src}
          />
        ) : visual?.src ? (
          <img
            src={visual.src}
            alt={current?.banner_title ?? ""}
            className="h-full w-full object-cover"
          />
        ) : (
          <img
            src={HERO_FALLBACK}
            alt="Hero"
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 bg-foreground/30" />
      </div>

      <div className="container relative mx-auto px-4 pb-16 pt-28 text-white lg:px-8">
        <div className="max-w-3xl fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> 50,000+ happy travelers
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-7xl">
            {current?.banner_title || (
              <>
                Discover Your <span className="text-gold">Next Adventure</span>
              </>
            )}
          </h1>
          {current?.banner_desc ? (
            <p
              className="mt-5 max-w-xl text-base text-white/85 sm:text-lg [&_p]:m-0"
              dangerouslySetInnerHTML={sanitizedHtml(stripHtml(current.banner_desc, 240))}
            />
          ) : (
            <p className="mt-5 max-w-xl text-base text-white/85 sm:text-lg">
              Handcrafted journeys across India and beyond — from beachside bliss to high-altitude treks. Find a trip you'll never forget.
            </p>
          )}
        </div>

        <div className="mt-10 grid items-start gap-6 fade-up lg:grid-cols-[1fr_380px]">
          <SearchBar />
          <AiTourChat />
        </div>

        <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/85 fade-up">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gold" /> Best price guarantee
          </span>
          <span className="inline-flex items-center gap-2">
            <Award className="h-4 w-4 text-gold" /> Award-winning service
          </span>
          <span className="inline-flex items-center gap-2">
            <HeadphonesIcon className="h-4 w-4 text-gold" /> 24/7 trip support
          </span>
        </div>

        {banners.length > 1 ? (
          <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-label={`Banner ${i + 1}`}
                onClick={() => setActiveBanner(i)}
                className={`h-2 w-2 rounded-full transition ${
                  i === activeBanner ? "bg-cta" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6">
      <div>
        {eyebrow ? (
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-cta">
            {eyebrow}
          </div>
        ) : null}
        <h2 className="font-display text-3xl font-bold sm:text-4xl">{title}</h2>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function PackagesSection({
  packTab,
  setPackTab,
  packages,
}: {
  packTab: "Domestic" | "International";
  setPackTab: (t: "Domestic" | "International") => void;
  packages: PackageRow[];
}) {
  return (
    <section className="bg-secondary/30">
      <div className="container mx-auto px-4 py-20 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-cta">
              Traveler favorites
            </div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Top selling packages
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Handpicked, all-inclusive itineraries — ready to book.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex rounded-lg bg-secondary p-1 text-sm font-medium">
              {(["Domestic", "International"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPackTab(tab)}
                  className={`rounded-md px-4 py-2 transition ${
                    packTab === tab
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <Link
              to="/packages"
              className="hidden items-center gap-1 text-sm font-semibold text-primary transition-all hover:gap-2 sm:inline-flex"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {packages.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No packages in this tab.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {packages.slice(0, 8).map((p) => (
              <PackageCard key={p.id} pkg={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Categories() {
  const categories = [
    { name: "Adventure", icon: Mountain, link: "/packages" },
    { name: "Honeymoon", icon: Heart, link: "/packages" },
    { name: "Family", icon: Users, link: "/packages" },
    { name: "Trekking", icon: Mountain, link: "/packages" },
    { name: "Beach", icon: Waves, link: "/packages" },
    { name: "Cultural", icon: Landmark, link: "/packages" },
  ];
  return (
    <section className="bg-sand">
      <div className="container mx-auto px-4 py-20 lg:px-8">
        <SectionHeader eyebrow="Browse by vibe" title="Find your kind of trip" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.name}
              to={c.link}
              className="group rounded-2xl border border-border bg-card p-5 text-center transition hover:border-primary/30 hover-lift"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-ocean text-primary-foreground transition-transform group-hover:scale-110">
                <c.icon className="h-6 w-6" />
              </div>
              <div className="mt-3 font-display font-semibold">{c.name}</div>
              <div className="text-xs text-muted-foreground">Explore</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChooseUs() {
  const items = [
    {
      icon: Tag,
      title: "Best Price Guarantee",
      desc: "Find a lower price? We'll match it and refund the difference.",
    },
    {
      icon: ShieldCheck,
      title: "Trusted Operators",
      desc: "Every partner vetted with 4.5+ stars and full safety checks.",
    },
    {
      icon: HeadphonesIcon,
      title: "24/7 Trip Support",
      desc: "Real humans on call wherever you are in the world.",
    },
    {
      icon: Sparkles,
      title: "Handcrafted Itineraries",
      desc: "Each trip designed by destination specialists, not algorithms.",
    },
  ];
  return (
    <section className="bg-secondary/40">
      <div className="container mx-auto px-4 py-20 lg:px-8">
        <SectionHeader eyebrow="Why SBM Tour India" title="Trip planning, made effortless" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <div
              key={it.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-soft hover-lift"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <it.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{it.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OfferBanner() {
  return (
    <section className="container mx-auto px-4 pb-20 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl gradient-cta p-8 text-cta-foreground md:p-14">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay">
          <img
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <span className="inline-block rounded-full bg-foreground/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cta-foreground">
              Limited offer
            </span>
            <h3 className="mt-3 max-w-2xl font-display text-3xl font-extrabold md:text-4xl">
              Up to 30% off summer escapes — book by June 30.
            </h3>
            <p className="mt-2 max-w-xl opacity-90">
              Tell us your dream itinerary and our team will craft a tailored quote within 24 hours.
            </p>
          </div>
          <Link
            to="/plan-trip"
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 font-semibold text-background transition hover:bg-foreground/90"
          >
            Plan a trip <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Testimonials({ reviews }: { reviews: ReviewRow[] }) {
  const [i, setI] = useState(0);
  if (reviews.length === 0) return null;
  const t = reviews[i % reviews.length];
  const avatar = legacyMediaUrl("review", t.review_image);

  return (
    <section className="container mx-auto px-4 py-20 lg:px-8">
      <SectionHeader eyebrow="Real travelers" title="Stories from the road" />
      <div className="relative mx-auto max-w-4xl rounded-3xl border border-border bg-card p-8 shadow-card md:p-12">
        <Quote className="absolute right-8 top-8 h-10 w-10 text-cta/30" />
        <div className="mb-4 flex items-center gap-1 text-gold">
          {Array.from({ length: 5 }).map((_, k) => (
            <Star key={k} className="h-5 w-5 fill-gold" />
          ))}
        </div>
        <p className="font-display text-xl leading-snug md:text-2xl">"{t.review_desc}"</p>
        <div className="mt-6 flex items-center gap-4">
          {avatar ? (
            <img
              src={avatar}
              alt={t.reviewer_name}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Users className="h-5 w-5" />
            </div>
          )}
          <div>
            <div className="font-semibold">{t.reviewer_name}</div>
            <div className="text-sm text-muted-foreground">{t.reviewer_place}</div>
          </div>
        </div>
        {reviews.length > 1 ? (
          <div className="absolute bottom-6 right-6 flex gap-2">
            <button
              type="button"
              aria-label="Previous"
              onClick={() =>
                setI((p) => (p - 1 + reviews.length) % reviews.length)
              }
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border hover:bg-secondary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => setI((p) => (p + 1) % reviews.length)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function LatestBlog({ blogs }: { blogs: BlogRow[] }) {
  if (blogs.length === 0) return null;
  return (
    <section className="container mx-auto px-4 pb-24 lg:px-8">
      <SectionHeader
        eyebrow="Travel stories"
        title="Latest from the journal"
        action={
          <Link
            to="/blog"
            className="hidden items-center gap-1 text-sm font-semibold text-primary transition-all hover:gap-2 sm:inline-flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      <div className="grid gap-8 md:grid-cols-3">
        {blogs.slice(0, 3).map((b) => {
          const cover = legacyMediaUrl("blogs", b.blog_image);
          return (
            <article
              key={b.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft hover-lift"
            >
              <Link to={`/blog/${b.blog_slug}`} className="group block">
                <div className="aspect-[16/10] overflow-hidden bg-muted">
                  {cover ? (
                    <img
                      src={cover}
                      alt=""
                      className="img-zoom h-full w-full object-cover"
                    />
                  ) : null}
                </div>
              </Link>
              <div className="p-5">
                <time className="text-xs text-muted-foreground">{b.blogDate}</time>
                <Link to={`/blog/${b.blog_slug}`}>
                  <h3 className="mt-1 font-display text-lg font-semibold transition-colors hover:text-primary">
                    {b.blog_name || b.blogPlace || "Story"}
                  </h3>
                </Link>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {stripHtml(b.blogDesc, 140)}
                </p>
                <Link
                  to={`/blog/${b.blog_slug}`}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-cta"
                >
                  Read more <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
