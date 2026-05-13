import { Link } from "react-router-dom";
import { Clock, MapPin, Star } from "lucide-react";
import { formatINR } from "@/lib/format";
import { legacyMediaUrl } from "@/lib/media";
import { pickLeadPrice } from "@/lib/pricing";
import type { PackageRow } from "@/types/home";

export function PackageCard({ pkg }: { pkg: PackageRow }) {
  const img = legacyMediaUrl("packages", pkg.featured_image);
  const lead = pickLeadPrice(pkg);
  const oldPrice = (() => {
    const d = pickLeadPrice({
      single_actual_price: pkg.single_actual_price,
      dual_actual_price: pkg.dual_actual_price,
    });
    if (lead && d && d > lead) return d;
    return null;
  })();

  return (
    <Link
      to={`/packages/${pkg.package_slug}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-soft hover-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {img ? (
          <img
            src={img}
            alt={pkg.packName}
            loading="lazy"
            className="img-zoom h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl opacity-30">
            🗺️
          </div>
        )}
        {pkg.today_deal ? (
          <span className="absolute left-3 top-3 inline-flex rounded-full bg-cta px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-cta-foreground shadow-cta">
            Today's deal
          </span>
        ) : null}
        {pkg.is_featured ? (
          <span className="absolute right-3 top-3 inline-flex rounded-full bg-background/90 px-3 py-1 text-[11px] font-semibold text-foreground">
            Bestseller
          </span>
        ) : null}
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {[pkg.destination_name, pkg.country_name].filter(Boolean).join(", ")}
          </span>
          {pkg.packDuration ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {pkg.packDuration}
            </span>
          ) : null}
        </div>
        <h3 className="mt-2 line-clamp-2 font-display text-lg font-semibold leading-snug transition-colors group-hover:text-primary">
          {pkg.packName}
        </h3>
        <div className="mt-3 flex items-center gap-1 text-sm">
          <Star className="h-4 w-4 fill-gold text-gold" />
          <span className="font-semibold">4.8</span>
          <span className="text-muted-foreground">· {pkg.packType}</span>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            {oldPrice ? (
              <div className="text-xs text-muted-foreground line-through">
                {formatINR(oldPrice)}
              </div>
            ) : null}
            {lead ? (
              <div className="font-display text-xl font-bold text-foreground">
                {formatINR(lead)}
                <span className="text-xs font-normal text-muted-foreground"> / person</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Ask for quote</div>
            )}
          </div>
          <span className="text-sm font-semibold text-cta transition-transform group-hover:translate-x-1">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
