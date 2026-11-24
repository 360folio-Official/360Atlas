import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MapView from "@/components/MapView";
import TourCard, { TourThumb } from "@/components/TourCard";
import { getDictionary } from "@/i18n/dictionaries";
import {
  getListing,
  getListings,
  getNearbyListings,
  getProvider,
} from "@/lib/data";
import { toMapPoints } from "@/lib/map-points";

export async function generateStaticParams() {
  return (await getListings()).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/tours/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListing(slug);
  return {
    title: listing && `${listing.title}, ${listing.city}`,
  };
}

export default async function TourPage({
  params,
}: PageProps<"/[lang]/tours/[slug]">) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) notFound();

  const { locale, dict } = await getDictionary();
  const provider = await getProvider(listing.providerSlug);
  const facts = [
    { label: dict.tour.category, value: dict.categories[listing.category] },
    { label: dict.tour.location, value: `${listing.city}, ${listing.country}` },
    { label: dict.tour.platform, value: listing.platform },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <div>
          <TourThumb listing={listing} className="aspect-[16/9] rounded-2xl" />
          {listing.sample && (
            <p className="mt-3 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
              {dict.tour.sample}
            </p>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            {listing.title}
          </h1>
          <dl className="mt-5 space-y-2 text-sm">
            {facts.map((fact) => (
              <div key={fact.label} className="flex gap-2">
                <dt className="w-28 shrink-0 text-muted">{fact.label}</dt>
                <dd className="font-medium text-ink">{fact.value}</dd>
              </div>
            ))}
            {provider && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-muted">
                  {dict.tour.createdBy}
                </dt>
                <dd>
                  <Link
                    href={`/${locale}/providers/${provider.slug}`}
                    className="font-medium text-brand hover:text-brand-strong"
                  >
                    {provider.name}
                  </Link>
                </dd>
              </div>
            )}
          </dl>

          <a
            href={`/go/${listing.id}`}
            target="_blank"
            rel="noopener"
            className="mt-7 inline-block rounded-full bg-brand px-7 py-3 font-semibold text-white hover:bg-brand-strong"
          >
            {dict.tour.open}
          </a>
          <p className="mt-2 text-xs text-muted">
            {dict.tour.opensOn} {listing.platform}
          </p>
        </div>
      </div>

      <div className="mt-10">
        <MapView
          points={toMapPoints([listing])}
          locale={locale}
          openLabel={dict.tour.open}
          center={[listing.lng, listing.lat]}
          zoom={12}
          className="h-72"
        />
      </div>

      <h2 className="mt-12 text-2xl font-bold text-ink">{dict.tour.nearby}</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {(await getNearbyListings(listing)).map((nearby) => (
          <TourCard
            key={nearby.id}
            listing={nearby}
            locale={locale}
            categoryName={dict.categories[nearby.category]}
          />
        ))}
      </div>
    </div>
  );
}
