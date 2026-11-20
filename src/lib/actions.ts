"use server";

import { and, eq, like, ne } from "drizzle-orm";
import { APIError } from "better-auth/api";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { members, serviceAreas } from "@/db/schema";
import { isLocale } from "@/i18n/config";
import { auth } from "./auth";
import { platformOptions } from "./platforms";
import { getCurrentUser } from "./session";

// Errors are returned as keys into the dictionary so the form can translate them.
export type FormState = { error?: string; ok?: boolean; slug?: string };

const text = (form: FormData, key: string, max = 500) =>
  String(form.get(key) ?? "").trim().slice(0, max);

const localeOf = (form: FormData) => {
  const value = text(form, "locale", 5);
  return isLocale(value) ? value : "en";
};

// ---------------------------------------------------------------------------
// Sign up, sign in, sign out
// ---------------------------------------------------------------------------

const authError = (error: unknown): string => {
  if (error instanceof APIError) {
    const code = String((error.body as { code?: string } | undefined)?.code ?? "");
    if (code.includes("ALREADY_EXISTS")) return "exists";
    if (code.includes("PASSWORD_TOO_SHORT")) return "weak";
    if (code.includes("INVALID_EMAIL_OR_PASSWORD") || code.includes("INVALID_EMAIL"))
      return "invalid";
  }
  console.error(error);
  return "generic";
};

export async function signUp(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form);
  const name = text(form, "name", 120);
  const email = text(form, "email", 255).toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!name || !email) return { error: "generic" };
  if (password.length < 10) return { error: "weak" };

  try {
    await auth.api.signUpEmail({
      body: { name, email, password },
      headers: await headers(),
    });
  } catch (error) {
    return { error: authError(error) };
  }
  redirect(`/${locale}/account`);
}

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form);
  const email = text(form, "email", 255).toLowerCase();
  const password = String(form.get("password") ?? "");
  try {
    await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });
  } catch (error) {
    return { error: authError(error) };
  }
  redirect(`/${locale}/account`);
}

export async function signOut(form: FormData) {
  const locale = localeOf(form);
  await auth.api.signOut({ headers: await headers() });
  redirect(`/${locale}`);
}

// ---------------------------------------------------------------------------
// Member profile
// ---------------------------------------------------------------------------

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "creator";

// A slug nobody else uses: "studio", then "studio-2", "studio-3"…
async function uniqueSlug(base: string, ownId?: number) {
  const taken = new Set(
    (
      await db
        .select({ slug: members.slug })
        .from(members)
        .where(
          ownId
            ? and(like(members.slug, `${base}%`), ne(members.id, ownId))
            : like(members.slug, `${base}%`),
        )
    ).map((row) => row.slug),
  );
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export async function saveProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect(`/${localeOf(form)}/sign-in`);

  const businessName = text(form, "businessName", 160);
  const type = text(form, "type") === "owner" ? "owner" : "provider";
  const bio = text(form, "bio", 1200);
  const websiteUrl = text(form, "websiteUrl", 500);
  const platforms = form
    .getAll("platforms")
    .map(String)
    .filter((p) => (platformOptions as string[]).includes(p));
  const languages = text(form, "languages", 300)
    .split(/[,،]/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 12);
  const city = text(form, "city", 120);
  const country = text(form, "country", 120);
  const lat = Number(form.get("lat"));
  const lng = Number(form.get("lng"));
  const radiusKm = Math.round(Number(form.get("radiusKm")) || 50);

  if (!businessName) return { error: "needName" };
  if (websiteUrl && !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(websiteUrl))
    return { error: "badWebsite" };
  if (
    !form.get("lat") ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  )
    return { error: "needLocation" };

  const profile = {
    businessName,
    type,
    bio: bio || null,
    websiteUrl: websiteUrl || null,
    platforms,
    languages,
  } as const;
  const area = {
    label: city || businessName,
    city: city || null,
    country: country || null,
    lat: Math.round(lat * 1e6) / 1e6,
    lng: Math.round(lng * 1e6) / 1e6,
    radiusKm: Math.min(2000, Math.max(1, radiusKm)),
  };

  const slug = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: members.id, slug: members.slug })
      .from(members)
      .where(eq(members.userId, user.id))
      .limit(1);

    let memberId: number;
    let slug: string;
    if (existing) {
      memberId = existing.id;
      slug = existing.slug;
      await tx.update(members).set(profile).where(eq(members.id, memberId));
    } else {
      slug = await uniqueSlug(slugify(businessName));
      const [result] = await tx.insert(members).values({
        ...profile,
        userId: user.id,
        slug,
        claimedAt: new Date(),
      });
      memberId = result.insertId;
    }

    // The first service area is the one on the profile form.
    const [first] = await tx
      .select({ id: serviceAreas.id })
      .from(serviceAreas)
      .where(eq(serviceAreas.memberId, memberId))
      .orderBy(serviceAreas.sortOrder, serviceAreas.id)
      .limit(1);
    if (first) {
      await tx.update(serviceAreas).set(area).where(eq(serviceAreas.id, first.id));
    } else {
      await tx.insert(serviceAreas).values({ ...area, memberId });
    }
    return slug;
  });

  updateTag("members");
  updateTag("listings");
  return { ok: true, slug };
}
