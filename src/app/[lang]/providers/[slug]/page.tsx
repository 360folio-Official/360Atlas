import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DarkPage, { DarkHeading } from "@/components/DarkPage";
import MapView from "@/components/MapView";
import TourCard from "@/components/TourCard";
import { getDictionary } from "@/i18n/dictionaries";
import { getListingsByProvider, getProvider, getProviders } from "@/lib/data";
import { toMapPoints } from "@/lib/map-points";

export async function generateStaticParams() {
  return (await getProviders()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/providers/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const provider = await getProvider(slug);
  return { title: provider && `${provider.name}, ${provider.city}` };
}

export default async function ProviderPage({
  params,
}: PageProps<"/[lang]/providers/[slug]">) {
  const { slug } = await params;
  const provider = await getProvider(slug);
  if (!provider) notFound();

  const { locale, dict } = await getDictionary();
  const labels = dict.providersPage;
  const listings = await getListingsByProvider(provider.slug);

  return (
    <DarkPage
      eyebrow={{ label: labels.title, href: `/${locale}/providers` }}
      title={
        <span className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-glow to-brand text-3xl font-bold text-ink shadow-[0_0_40px_-6px] shadow-glow/60 sm:h-20 sm:w-20">
            {provider.name.charAt(0)}
          </span>
          {provider.name}
        </span>
      }
      intro={
        <span className="flex flex-wrap items-center gap-3">
          {provider.verified && (
            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-medium text-emerald-300">
              ✓ {labels.verified}
            </span>
          )}
          <span>
            {labels.operatesWithin} {provider.radiusKm} {labels.km}{" "}
            {provider.city}, {provider.country}
          </span>
        </span>
      }
      header={
        <>
          <p className="max-w-xl leading-relaxed text-white/80">{provider.bio}</p>
          <p className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-white/50">{labels.platforms}:</span>
            {provider.platforms.map((platform) => (
              <span
                key={platform}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-0.5 text-white/80"
              >
                {platform}
              </span>
            ))}
          </p>
        </>
      }
      aside={
        <div className="w-full rounded-2xl border border-white/10 bg-ink/60 p-6 text-center backdrop-blur-md lg:w-72">
          <button
            type="button"
            disabled
            className="w-full rounded-full bg-glow px-6 py-3 font-semibold text-ink opacity-50"
          >
            {labels.enquire}
          </button>
          <p className="mt-3 text-xs text-white/50">{labels.enquireSoon}</p>
        </div>
      }
    >
      <DarkHeading>{labels.tours}</DarkHeading>
      <MapView
        points={toMapPoints(listings)}
        locale={locale}
        openLabel={dict.tour.open}
        center={[provider.lng, provider.lat]}
        zoom={9}
        className="h-80 sm:h-96"
      />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {listings.map((listing) => (
          <TourCard
            key={listing.id}
            listing={listing}
            locale={locale}
            categoryName={dict.categories[listing.category]}
            dark
          />
        ))}
      </div>
    </DarkPage>
  );
}
