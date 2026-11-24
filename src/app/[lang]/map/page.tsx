import type { Metadata } from "next";
import ExploreMap from "@/components/ExploreMap";
import { getDictionary } from "@/i18n/dictionaries";
import { getCategories, getListings } from "@/lib/data";
import { toGlobePoints } from "@/lib/map-points";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.mapPage.title };
}

export default async function MapPage() {
  const { locale, dict } = await getDictionary();
  const listings = await getListings();
  // Only offer filters that would show something.
  const used = new Set(listings.map((l) => l.category));

  return (
    <ExploreMap
      points={toGlobePoints(listings, (slug) => dict.categories[slug])}
      locale={locale}
      title={dict.mapPage.title}
      intro={dict.mapPage.intro}
      openLabel={dict.tour.open}
      allLabel={dict.mapPage.allCategories}
      resultsLabel={dict.mapPage.results}
      categories={getCategories()
        .filter(({ slug }) => used.has(slug))
        .map(({ slug, icon }) => ({ slug, icon, name: dict.categories[slug] }))}
    />
  );
}
