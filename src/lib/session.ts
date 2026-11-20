import "server-only";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/db";
import { members, serviceAreas } from "@/db/schema";
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
