import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Provider } from "@/lib/data";

export default function ProviderCard({
  provider,
  locale,
  verifiedLabel,
}: {
  provider: Provider;
  locale: Locale;
  verifiedLabel: string;
}) {
  return (
    <Link
      href={`/${locale}/providers/${provider.slug}`}
      className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand/10"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-lg font-bold text-brand-strong">
          {provider.name.charAt(0)}
        </span>
        <div>
          <h3 className="font-semibold leading-snug text-ink">
            {provider.name}
          </h3>
          <p className="text-sm text-muted">
            {provider.city}, {provider.country}
          </p>
        </div>
      </div>
      <p className="mt-3 flex-1 text-sm text-muted">{provider.bio}</p>
      <p className="mt-3 flex flex-wrap gap-2 text-xs">
        {provider.verified && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
            ✓ {verifiedLabel}
          </span>
        )}
        {provider.platforms.map((platform) => (
          <span
            key={platform}
            className="rounded-full bg-background px-2 py-0.5 text-muted"
          >
            {platform}
          </span>
        ))}
      </p>
    </Link>
  );
}
