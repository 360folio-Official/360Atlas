// Read layer for the public area. It serves the sample data in src/data/seed.ts
// today; swap these bodies for Supabase queries once the project is connected
// (the schema is in supabase/migrations).
import {
  categories,
  listings,
  providers,
  type CategorySlug,
  type Listing,
} from "@/data/seed";

export type { Category, CategorySlug, Listing, Provider } from "@/data/seed";

export const getCategories = () => categories;
export const getCategory = (slug: string) =>
  categories.find((c) => c.slug === slug);

export const getListings = () => listings;
export const getListing = (slug: string) =>
  listings.find((l) => l.slug === slug);
export const getListingById = (id: string) =>
  listings.find((l) => l.id === id);
export const getFeaturedListings = () => listings.filter((l) => l.featured);
export const getLatestListings = (limit = 8) =>
  [...listings].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, limit);
export const getListingsByCategory = (slug: CategorySlug) =>
  listings.filter((l) => l.category === slug);
export const getListingsByProvider = (slug: string) =>
  listings.filter((l) => l.providerSlug === slug);

export const getProviders = () => providers;
export const getProvider = (slug: string) =>
  providers.find((p) => p.slug === slug);
export const getFeaturedProviders = () => providers.filter((p) => p.featured);

const toRad = (deg: number) => (deg * Math.PI) / 180;

export const distanceKm = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) => {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

export const getNearbyListings = (listing: Listing, limit = 4) =>
  listings
    .filter((l) => l.id !== listing.id)
    .map((l) => ({ l, d: distanceKm(listing, l) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map(({ l }) => l);
