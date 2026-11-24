// Read layer for the public area, backed by MariaDB.
// Results are cached and tagged; anything that writes listings or members must
// call updateTag("listings") / updateTag("members") so pages refresh.
import "server-only";
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { listings as listingsTable, members, serviceAreas } from "@/db/schema";
import {
  type CategorySlug,
  type Listing,
  type Platform,
  type Provider,
} from "@/data/seed";

export type { Category, CategorySlug, Listing, Provider } from "@/data/seed";
export { distanceKm } from "./geo";
export { getCategories, getCategory } from "./categories";
import { distanceKm } from "./geo";

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

const listingColumns = {
  id: listingsTable.id,
  slug: listingsTable.slug,
  title: listingsTable.title,
  category: listingsTable.categorySlug,
  city: listingsTable.city,
  country: listingsTable.country,
  lat: listingsTable.lat,
  lng: listingsTable.lng,
  platform: listingsTable.platform,
  tourUrl: listingsTable.tourUrl,
  providerSlug: members.slug,
  featured: listingsTable.featured,
  seeded: listingsTable.seeded,
  createdAt: listingsTable.createdAt,
};

type ListingRow = {
  id: number;
  slug: string;
  title: string;
  category: string;
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  platform: string;
  tourUrl: string;
  providerSlug: string | null;
  featured: boolean;
  seeded: boolean;
  createdAt: Date;
};

const toListing = (row: ListingRow): Listing => ({
  id: String(row.id),
  slug: row.slug,
  title: row.title,
  category: row.category as CategorySlug,
  city: row.city ?? "",
  country: row.country ?? "",
  lat: Number(row.lat),
  lng: Number(row.lng),
  platform: row.platform as Platform,
  tourUrl: row.tourUrl,
  providerSlug: row.providerSlug ?? "",
  featured: row.featured,
  addedAt: row.createdAt.toISOString().slice(0, 10),
  sample: row.seeded,
});

// Live listings with coordinates: everything the public map and pages show.
const liveListings = () =>
  db
    .select(listingColumns)
    .from(listingsTable)
    .leftJoin(members, eq(members.id, listingsTable.memberId))
    .$dynamic();

const live = and(
  eq(listingsTable.status, "live"),
  isNotNull(listingsTable.lat),
  isNotNull(listingsTable.lng),
);

export async function getListings(): Promise<Listing[]> {
  "use cache";
  cacheTag("listings");
  cacheLife("hours");
  const rows = await liveListings().where(live).orderBy(asc(listingsTable.id));
  return rows.map(toListing);
}

export async function getListing(slug: string): Promise<Listing | undefined> {
  "use cache";
  cacheTag("listings");
  cacheLife("hours");
  const [row] = await liveListings()
    .where(and(live, eq(listingsTable.slug, slug)))
    .limit(1);
  return row && toListing(row);
}

// Used by the /go/[id] redirect, which runs on every click, so not cached.
export async function getListingById(id: string): Promise<Listing | undefined> {
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId)) return undefined;
  const [row] = await liveListings()
    .where(and(live, eq(listingsTable.id, numericId)))
    .limit(1);
  return row && toListing(row);
}

export async function getFeaturedListings(): Promise<Listing[]> {
  "use cache";
  cacheTag("listings");
  cacheLife("hours");
  const rows = await liveListings()
    .where(and(live, eq(listingsTable.featured, true)))
    .orderBy(asc(listingsTable.id));
  return rows.map(toListing);
}

export async function getLatestListings(limit = 8): Promise<Listing[]> {
  "use cache";
  cacheTag("listings");
  cacheLife("hours");
  const rows = await liveListings()
    .where(live)
    .orderBy(desc(listingsTable.createdAt), desc(listingsTable.id))
    .limit(limit);
  return rows.map(toListing);
}

export async function getListingsByCategory(slug: CategorySlug): Promise<Listing[]> {
  "use cache";
  cacheTag("listings");
  cacheLife("hours");
  const rows = await liveListings()
    .where(and(live, eq(listingsTable.categorySlug, slug)))
    .orderBy(asc(listingsTable.id));
  return rows.map(toListing);
}

export async function getListingsByProvider(slug: string): Promise<Listing[]> {
  "use cache";
  cacheTag("listings", "members");
  cacheLife("hours");
  const rows = await liveListings()
    .where(and(live, eq(members.slug, slug)))
    .orderBy(asc(listingsTable.id));
  return rows.map(toListing);
}

// Number of live tours in each category.
export async function getCategoryCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const listing of await getListings()) {
    counts[listing.category] = (counts[listing.category] ?? 0) + 1;
  }
  return counts;
}

// Closest tours to this one, from the cached list of live tours.
export async function getNearbyListings(listing: Listing, limit = 4): Promise<Listing[]> {
  const all = await getListings();
  return all
    .filter((l) => l.id !== listing.id)
    .map((l) => ({ l, d: distanceKm(listing, l) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map(({ l }) => l);
}

// ---------------------------------------------------------------------------
// Providers (members of type "provider" with their first service area)
// ---------------------------------------------------------------------------

async function loadProviders(where?: ReturnType<typeof eq>): Promise<Provider[]> {
  const rows = await db
    .select({
      slug: members.slug,
      name: members.businessName,
      bio: members.bio,
      platforms: members.platforms,
      verified: members.verified,
      featured: members.featured,
      city: serviceAreas.city,
      country: serviceAreas.country,
      lat: serviceAreas.lat,
      lng: serviceAreas.lng,
      radiusKm: serviceAreas.radiusKm,
      areaOrder: serviceAreas.sortOrder,
    })
    .from(members)
    .innerJoin(serviceAreas, eq(serviceAreas.memberId, members.id))
    .where(and(eq(members.type, "provider"), where))
    .orderBy(asc(members.id), asc(serviceAreas.sortOrder), asc(serviceAreas.id));

  // Keep only each member's first area.
  const seen = new Set<string>();
  const providers: Provider[] = [];
  for (const row of rows) {
    if (seen.has(row.slug)) continue;
    seen.add(row.slug);
    providers.push({
      slug: row.slug,
      name: row.name,
      bio: row.bio ?? "",
      platforms: row.platforms as Platform[],
      verified: row.verified,
      featured: row.featured,
      city: row.city ?? "",
      country: row.country ?? "",
      lat: Number(row.lat),
      lng: Number(row.lng),
      radiusKm: row.radiusKm,
    });
  }
  return providers;
}

export async function getProviders(): Promise<Provider[]> {
  "use cache";
  cacheTag("members");
  cacheLife("hours");
  return loadProviders();
}

export async function getProvider(slug: string): Promise<Provider | undefined> {
  "use cache";
  cacheTag("members");
  cacheLife("hours");
  const [provider] = await loadProviders(eq(members.slug, slug));
  return provider;
}

export async function getFeaturedProviders(): Promise<Provider[]> {
  "use cache";
  cacheTag("members");
  cacheLife("hours");
  return loadProviders(eq(members.featured, true));
}
