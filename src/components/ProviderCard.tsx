import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Provider } from "@/lib/data";

export default function ProviderCard({
  provider,
  locale,
  verifiedLabel,
  dark = false,
}: {
  provider: Provider;
  locale: Locale;
  verifiedLabel: string;
  // For dark pages: glass card instead of white.
  dark?: boolean;
}) {
  return (
    <Link
      href={`/${locale}/providers/${provider.slug}`}
      className={`group flex h-full flex-col rounded-2xl border p-5 transition duration-300 hover:-translate-y-1 ${
        dark
          ? "border-white/10 bg-white/[0.04] text-white hover:border-glow/40 hover:shadow-[0_20px_50px_-20px] hover:shadow-glow/30"
          : "border-border bg-surface shadow-sm hover:shadow-xl hover:shadow-brand/10"
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
            dark
              ? "bg-gradient-to-br from-glow to-brand text-ink"
              : "bg-brand-soft text-brand-strong"
          }`}
        >
          {provider.name.charAt(0)}
        </span>
        <div>
          <h3
            className={`font-semibold leading-snug ${
              dark ? "text-white group-hover:text-glow" : "text-ink"
            }`}
          >
            {provider.name}
          </h3>
          <p className={`text-sm ${dark ? "text-white/55" : "text-muted"}`}>
            {provider.city}, {provider.country}
          </p>
        </div>
      </div>
      <p className={`mt-3 flex-1 text-sm ${dark ? "text-white/65" : "text-muted"}`}>
        {provider.bio}
      </p>
      <p className="mt-3 flex flex-wrap gap-2 text-xs">
        {provider.verified && (
          <span
            className={`rounded-full px-2 py-0.5 font-medium ${
              dark ? "bg-emerald-400/15 text-emerald-300" : "bg-emerald-50 text-emerald-700"
            }`}
          >
            ✓ {verifiedLabel}
          </span>
        )}
        {provider.platforms.map((platform) => (
          <span
            key={platform}
            className={`rounded-full px-2 py-0.5 ${
              dark ? "bg-white/10 text-white/60" : "bg-background text-muted"
            }`}
          >
            {platform}
          </span>
        ))}
      </p>
    </Link>
  );
}
