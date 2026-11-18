// Sample data so the public area runs before the database is connected.
// Every listing here is a placeholder: tour URLs point at example.com.

export type CategorySlug =
  | "hotels"
  | "attractions"
  | "museums"
  | "venues"
  | "restaurants"
  | "real-estate"
  | "education"
  | "nature";

export type Category = { slug: CategorySlug; icon: string; hue: number };

export type Platform =
  | "Matterport"
  | "Kuula"
  | "3DVista"
  | "CloudPano"
  | "Google Street View"
  | "Panoee";

export type Provider = {
  slug: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  radiusKm: number;
  bio: string;
  platforms: Platform[];
  verified: boolean;
  featured: boolean;
};

export type Listing = {
  id: string;
  slug: string;
  title: string;
  category: CategorySlug;
  city: string;
  country: string;
  lat: number;
  lng: number;
  platform: Platform;
  tourUrl: string;
  providerSlug: string;
  featured: boolean;
  addedAt: string;
};

export const categories: Category[] = [
  { slug: "hotels", icon: "🏨", hue: 200 },
  { slug: "attractions", icon: "🎡", hue: 280 },
  { slug: "museums", icon: "🏛️", hue: 35 },
  { slug: "venues", icon: "🎪", hue: 330 },
  { slug: "restaurants", icon: "🍽️", hue: 10 },
  { slug: "real-estate", icon: "🏠", hue: 150 },
  { slug: "education", icon: "🎓", hue: 240 },
  { slug: "nature", icon: "🌿", hue: 120 },
];

export const providers: Provider[] = [
  {
    slug: "gulf-panorama-studio",
    name: "Gulf Panorama Studio",
    city: "Dubai",
    country: "United Arab Emirates",
    lat: 25.2048,
    lng: 55.2708,
    radiusKm: 150,
    bio: "Hospitality and real-estate virtual tours across the UAE.",
    platforms: ["Matterport", "3DVista"],
    verified: true,
    featured: true,
  },
  {
    slug: "thames-360",
    name: "Thames 360",
    city: "London",
    country: "United Kingdom",
    lat: 51.5072,
    lng: -0.1276,
    radiusKm: 100,
    bio: "Museums, venues and heritage sites captured in high-resolution 360°.",
    platforms: ["Kuula", "Matterport"],
    verified: true,
    featured: true,
  },
  {
    slug: "atelier-immersif",
    name: "Atelier Immersif",
    city: "Paris",
    country: "France",
    lat: 48.8566,
    lng: 2.3522,
    radiusKm: 80,
    bio: "Boutique hotels, restaurants and galleries in and around Paris.",
    platforms: ["3DVista", "Panoee"],
    verified: false,
    featured: true,
  },
  {
    slug: "iberia-virtual",
    name: "Iberia Virtual",
    city: "Barcelona",
    country: "Spain",
    lat: 41.3874,
    lng: 2.1686,
    radiusKm: 200,
    bio: "Tours for attractions, event venues and holiday rentals on the Spanish coast.",
    platforms: ["CloudPano", "Kuula"],
    verified: true,
    featured: false,
  },
  {
    slug: "hudson-spaces",
    name: "Hudson Spaces",
    city: "New York",
    country: "United States",
    lat: 40.7128,
    lng: -74.006,
    radiusKm: 120,
    bio: "Real estate, campuses and restaurants across the New York area.",
    platforms: ["Matterport"],
    verified: false,
    featured: true,
  },
  {
    slug: "sakura-vr",
    name: "Sakura VR",
    city: "Tokyo",
    country: "Japan",
    lat: 35.6762,
    lng: 139.6503,
    radiusKm: 100,
    bio: "Gardens, temples and hotels across Kantō in 360°.",
    platforms: ["Kuula", "Google Street View"],
    verified: true,
    featured: false,
  },
];

type Row = [
  title: string,
  category: CategorySlug,
  city: string,
  country: string,
  lat: number,
  lng: number,
  platform: Platform,
  providerSlug: string,
  featured: boolean,
];

const rows: Row[] = [
  ["Marina Skyline Hotel", "hotels", "Dubai", "United Arab Emirates", 25.0805, 55.1403, "Matterport", "gulf-panorama-studio", true],
  ["Old Town Heritage House", "museums", "Dubai", "United Arab Emirates", 25.2637, 55.2972, "3DVista", "gulf-panorama-studio", false],
  ["Creekside Banquet Hall", "venues", "Dubai", "United Arab Emirates", 25.2285, 55.3273, "Matterport", "gulf-panorama-studio", false],
  ["Palm View Residence", "real-estate", "Dubai", "United Arab Emirates", 25.1124, 55.139, "Matterport", "gulf-panorama-studio", true],
  ["Riverside Maritime Gallery", "museums", "London", "United Kingdom", 51.4826, -0.0077, "Kuula", "thames-360", true],
  ["Garden Square Townhouse Hotel", "hotels", "London", "United Kingdom", 51.4975, -0.1687, "Matterport", "thames-360", false],
  ["Brick Lane Supper Club", "restaurants", "London", "United Kingdom", 51.5215, -0.0716, "Kuula", "thames-360", false],
  ["Royal Park Glasshouse", "nature", "London", "United Kingdom", 51.4787, -0.2956, "Kuula", "thames-360", false],
  ["Left Bank Boutique Hotel", "hotels", "Paris", "France", 48.8534, 2.3338, "3DVista", "atelier-immersif", true],
  ["Canal Quarter Bistro", "restaurants", "Paris", "France", 48.8721, 2.3655, "Panoee", "atelier-immersif", false],
  ["Marais Contemporary Art Space", "museums", "Paris", "France", 48.8598, 2.3622, "3DVista", "atelier-immersif", true],
  ["Gothic Quarter Rooftop Venue", "venues", "Barcelona", "Spain", 41.3833, 2.1777, "CloudPano", "iberia-virtual", true],
  ["Harbour Aquarium Walkthrough", "attractions", "Barcelona", "Spain", 41.3766, 2.1843, "Kuula", "iberia-virtual", false],
  ["Costa Beachfront Villa", "real-estate", "Sitges", "Spain", 41.2372, 1.8059, "CloudPano", "iberia-virtual", false],
  ["Midtown Loft Apartment", "real-estate", "New York", "United States", 40.7549, -73.984, "Matterport", "hudson-spaces", false],
  ["Brooklyn Design College", "education", "New York", "United States", 40.6895, -73.9637, "Matterport", "hudson-spaces", true],
  ["Harbor Observation Deck", "attractions", "New York", "United States", 40.7033, -74.017, "Matterport", "hudson-spaces", true],
  ["Shinjuku Garden Ryokan", "hotels", "Tokyo", "Japan", 35.6852, 139.7101, "Kuula", "sakura-vr", true],
  ["Asakusa Temple Grounds", "attractions", "Tokyo", "Japan", 35.7148, 139.7967, "Google Street View", "sakura-vr", false],
  ["Riverside Cherry Blossom Park", "nature", "Tokyo", "Japan", 35.6467, 139.6982, "Kuula", "sakura-vr", true],
];

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const listings: Listing[] = rows.map(
  ([title, category, city, country, lat, lng, platform, providerSlug, featured], i) => {
    const slug = `${slugify(title)}-${slugify(city)}`;
    return {
      id: String(1001 + i),
      slug,
      title,
      category,
      city,
      country,
      lat,
      lng,
      platform,
      tourUrl: `https://example.com/sample-tour/${slug}`,
      providerSlug,
      featured,
      addedAt: `2026-11-${String(10 - (i % 10)).padStart(2, "0")}`,
    };
  },
);
