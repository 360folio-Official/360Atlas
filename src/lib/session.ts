import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/db";
import { listings, members, serviceAreas } from "@/db/schema";
import { auth } from "./auth";

export type CurrentUser = { id: string; name: string; email: string; role: string };

// Reads the session cookie. Call only inside a <Suspense> boundary.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  // Session checks compare expiry times, so they only run on a real request.
  await connection();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email } = session.user;
  const role = (session.user as { role?: string }).role ?? "member";
  return { id, name, email, role };
}

export async function requireUser(locale: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/sign-in`);
  return user;
}

export type MemberProfile = {
  id: number;
  slug: string;
  type: "provider" | "owner";
  businessName: string;
  bio: string;
  websiteUrl: string;
  platforms: string[];
  languages: string[];
  area: {
    city: string;
    country: string;
    lat: number;
    lng: number;
    radiusKm: number;
  } | null;
};

// The signed-in user's business profile, or null before they create one.
export async function getMemberForUser(userId: string): Promise<MemberProfile | null> {
  const [member] = await db
    .select()
    .from(members)
    .where(eq(members.userId, userId))
    .limit(1);
  if (!member) return null;
  const [area] = await db
    .select()
    .from(serviceAreas)
    .where(eq(serviceAreas.memberId, member.id))
    .orderBy(serviceAreas.sortOrder, serviceAreas.id)
    .limit(1);
  return {
    id: member.id,
    slug: member.slug,
    type: member.type,
    businessName: member.businessName,
    bio: member.bio ?? "",
    websiteUrl: member.websiteUrl ?? "",
    platforms: member.platforms,
    languages: member.languages,
    area: area
      ? {
          city: area.city ?? "",
          country: area.country ?? "",
          lat: Number(area.lat),
          lng: Number(area.lng),
          radiusKm: area.radiusKm,
        }
      : null,
  };
}

export type MemberTour = {
  id: number;
  slug: string;
  title: string;
  tourUrl: string;
  category: string;
  platform: string;
  city: string;
  country: string;
  lat: number | null;
  lng: number | null;
  status: "pending" | "live" | "broken_link" | "hidden";
};

const memberTourColumns = {
  id: listings.id,
  slug: listings.slug,
  title: listings.title,
  tourUrl: listings.tourUrl,
  category: listings.categorySlug,
  platform: listings.platform,
  city: listings.city,
  country: listings.country,
  lat: listings.lat,
  lng: listings.lng,
  status: listings.status,
};

const toMemberTour = (
  row: Omit<MemberTour, "city" | "country"> & { city: string | null; country: string | null },
): MemberTour => ({
  ...row,
  city: row.city ?? "",
  country: row.country ?? "",
  lat: row.lat === null ? null : Number(row.lat),
  lng: row.lng === null ? null : Number(row.lng),
});

// Every tour a member owns, newest first, whatever its status.
export async function getMemberTours(memberId: number): Promise<MemberTour[]> {
  const rows = await db
    .select(memberTourColumns)
    .from(listings)
    .where(eq(listings.memberId, memberId))
    .orderBy(desc(listings.createdAt), desc(listings.id));
  return rows.map(toMemberTour);
}

// One of the member's own tours, or null if it isn't theirs.
export async function getMemberTour(memberId: number, id: number): Promise<MemberTour | null> {
  if (!Number.isSafeInteger(id)) return null;
  const [row] = await db
    .select(memberTourColumns)
    .from(listings)
    .where(and(eq(listings.id, id), eq(listings.memberId, memberId)))
    .limit(1);
  return row ? toMemberTour(row) : null;
}
