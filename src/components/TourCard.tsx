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
  dark = false,
}: {
  listing: Listing;
  locale: Locale;
  categoryName: string;
  // For dark pages: glass card instead of white.
  dark?: boolean;
}) {
  return (
    <Link
      href={`/${locale}/tours/${listing.slug}`}
      className={`group block overflow-hidden rounded-2xl border transition duration-300 hover:-translate-y-1 ${
        dark
          ? "border-white/10 bg-white/[0.04] hover:border-glow/40 hover:shadow-[0_20px_50px_-20px] hover:shadow-glow/30"
          : "border-border bg-surface shadow-sm hover:shadow-xl hover:shadow-brand/10"
      }`}
    >
      <div className="overflow-hidden">
        <TourThumb
          listing={listing}
          className="aspect-[16/10] transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3
          className={`font-semibold leading-snug ${
            dark ? "text-white group-hover:text-glow" : "text-ink group-hover:text-brand"
          }`}
        >
          {listing.title}
        </h3>
        <p className={`mt-1 text-sm ${dark ? "text-white/55" : "text-muted"}`}>
          {listing.city}, {listing.country}
        </p>
        <p className="mt-2 flex flex-wrap gap-2 text-xs">
          <span
            className={`rounded-full px-2 py-0.5 font-medium ${
              dark ? "bg-glow/15 text-teal-200" : "bg-brand-soft text-brand-strong"
            }`}
          >
            {categoryName}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 ${
              dark ? "bg-white/10 text-white/60" : "bg-background text-muted"
            }`}
          >
            {listing.platform}
          </span>
        </p>
      </div>
    </Link>
  );
}
