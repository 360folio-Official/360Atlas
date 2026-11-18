import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { getCategory, type Listing } from "@/lib/data";

// Placeholder artwork until real thumbnails are stored with each listing.
export function TourThumb({
  listing,
  className = "",
}: {
  listing: Listing;
  className?: string;
}) {
  const category = getCategory(listing.category);
  const hue = category?.hue ?? 200;
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 55% 42%), hsl(${(hue + 40) % 360} 60% 24%))`,
      }}
    >
      <span className="text-5xl drop-shadow" aria-hidden>
        {category?.icon}
      </span>
      <span className="absolute end-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-xs font-semibold text-white">
        360°
      </span>
    </div>
  );
}

export default function TourCard({
  listing,
  locale,
  categoryName,
}: {
  listing: Listing;
  locale: Locale;
  categoryName: string;
}) {
  return (
    <Link
      href={`/${locale}/tours/${listing.slug}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand/10"
    >
      <div className="overflow-hidden">
        <TourThumb
          listing={listing}
          className="aspect-[16/10] transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold leading-snug text-ink group-hover:text-brand">
          {listing.title}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {listing.city}, {listing.country}
        </p>
        <p className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-brand-soft px-2 py-0.5 font-medium text-brand-strong">
            {categoryName}
          </span>
          <span className="rounded-full bg-background px-2 py-0.5 text-muted">
            {listing.platform}
          </span>
        </p>
      </div>
    </Link>
  );
}
