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

  return (
    <ExploreMap
      points={toGlobePoints(getListings(), (slug) => dict.categories[slug])}
      locale={locale}
      title={dict.mapPage.title}
      intro={dict.mapPage.intro}
      openLabel={dict.tour.open}
      allLabel={dict.mapPage.allCategories}
      resultsLabel={dict.mapPage.results}
      categories={getCategories().map(({ slug, icon }) => ({
        slug,
        icon,
        name: dict.categories[slug],
      }))}
    />
  );
}
