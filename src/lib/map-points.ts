import type { MapPoint } from "@/components/MapView";
import type { CategorySlug } from "@/data/seed";
import { getCategory, type Listing } from "@/lib/data";

export const toMapPoints = (listings: Listing[]): MapPoint[] =>
  listings.map((l) => ({
    slug: l.slug,
    title: l.title,
    place: `${l.city}, ${l.country}`,
    category: l.category,
    lng: l.lng,
    lat: l.lat,
  }));

// Points for the dark globe maps (homepage hero and map page).
export type GlobePoint = {
  id: number;
  slug: string;
  title: string;
  place: string;
  category: CategorySlug;
  categoryName: string;
  icon: string;
  hue: number;
  lng: number;
  lat: number;
  featured: boolean;
};

export const toGlobePoints = (
  listings: Listing[],
  categoryName: (slug: CategorySlug) => string,
): GlobePoint[] =>
  listings.map((l) => {
    const category = getCategory(l.category);
    return {
      id: Number(l.id),
      slug: l.slug,
      title: l.title,
      place: `${l.city}, ${l.country}`,
      category: l.category,
      categoryName: categoryName(l.category),
      icon: category?.icon ?? "📍",
      hue: category?.hue ?? 200,
      lng: l.lng,
      lat: l.lat,
      featured: l.featured,
    };
  });
