import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MapView from "@/components/MapView";
import TourCard from "@/components/TourCard";
import { getDictionary } from "@/i18n/dictionaries";
import { getListingsByProvider, getProvider, getProviders } from "@/lib/data";
import { toMapPoints } from "@/lib/map-points";

export function generateStaticParams() {
  return getProviders().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/providers/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const provider = getProvider(slug);
  return { title: provider && `${provider.name}, ${provider.city}` };
}

export default async function ProviderPage({
  params,
}: PageProps<"/[lang]/providers/[slug]">) {
  const { slug } = await params;
  const provider = getProvider(slug);
  if (!provider) notFound();

  const { locale, dict } = await getDictionary();
  const labels = dict.providersPage;
  const listings = getListingsByProvider(provider.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-start gap-5">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-soft text-3xl font-bold text-brand-strong">
          {provider.name.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            {provider.name}
            {provider.verified && (
              <span className="ms-3 rounded-full bg-emerald-50 px-3 py-1 align-middle text-sm font-medium text-emerald-700">
                ✓ {labels.verified}
              </span>
            )}
          </h1>
          <p className="mt-1 text-muted">
            {labels.operatesWithin} {provider.radiusKm} {labels.km}{" "}
            {provider.city}, {provider.country}
          </p>
          <p className="mt-4 max-w-2xl">{provider.bio}</p>
          <p className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted">{labels.platforms}:</span>
            {provider.platforms.map((platform) => (
              <span
                key={platform}
                className="rounded-full border border-border bg-surface px-3 py-0.5"
              >
                {platform}
              </span>
            ))}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 text-center">
          <button
            type="button"
            disabled
            className="rounded-full bg-brand px-6 py-3 font-semibold text-white opacity-50"
          >
            {labels.enquire}
          </button>
          <p className="mt-2 max-w-48 text-xs text-muted">
            {labels.enquireSoon}
          </p>
        </div>
      </div>

      <h2 className="mt-12 text-2xl font-bold text-ink">{labels.tours}</h2>
      <div className="mt-5">
        <MapView
          points={toMapPoints(listings)}
          locale={locale}
          openLabel={dict.tour.open}
          center={[provider.lng, provider.lat]}
          zoom={9}
          className="h-80"
        />
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {listings.map((listing) => (
          <TourCard
            key={listing.id}
            listing={listing}
            locale={locale}
            categoryName={dict.categories[listing.category]}
          />
        ))}
      </div>
    </div>
  );
}
