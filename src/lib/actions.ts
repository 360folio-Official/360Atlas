"use server";

import { and, eq, like, ne } from "drizzle-orm";
import { APIError } from "better-auth/api";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { listings, members, serviceAreas } from "@/db/schema";
import { isLocale } from "@/i18n/config";
import { auth } from "./auth";
import { getCategory } from "./categories";
import { platformOptions, tourPlatformOptions } from "./platforms";
import { getCurrentUser } from "./session";
import { deleteThumbnail, saveThumbnail } from "./uploads";

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

const slugify = (value: string, fallback = "creator") =>
  value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || fallback;

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
  return nextFreeSlug(base, taken);
}

const nextFreeSlug = (base: string, taken: Set<string>) => {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
};

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

// ---------------------------------------------------------------------------
// Tours
// ---------------------------------------------------------------------------

// The signed-in user's member id, or null before they save a profile.
async function currentMemberId(locale: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/sign-in`);
  const [member] = await db
    .select({ id: members.id })
    .from(members)
    .where(eq(members.userId, user.id))
    .limit(1);
  return member?.id ?? null;
}

const validTourUrl = (value: string) => {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".");
  } catch {
    return false;
  }
};

const isDuplicate = (error: unknown) =>
  (error as { cause?: { code?: string }; code?: string })?.cause?.code === "ER_DUP_ENTRY" ||
  (error as { code?: string })?.code === "ER_DUP_ENTRY";

// Adds a tour, or updates one when the form has an id. New tours go live
// straight away; there is no review step yet.
export async function saveTour(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form);
  const memberId = await currentMemberId(locale);
  if (!memberId) return { error: "needProfile" };

  const id = form.get("id") ? Number(form.get("id")) : null;
  const title = text(form, "title", 200);
  const tourUrl = text(form, "tourUrl", 700);
  const category = text(form, "category", 40);
  const platform = text(form, "platform", 60);
  const city = text(form, "city", 120);
  const country = text(form, "country", 120);
  const lat = Number(form.get("lat"));
  const lng = Number(form.get("lng"));

  if (!title) return { error: "needTitle" };
  if (!validTourUrl(tourUrl)) return { error: "badUrl" };
  if (!getCategory(category)) return { error: "needCategory" };
  if (!(tourPlatformOptions as string[]).includes(platform)) return { error: "needPlatform" };
  if (
    !form.get("lat") ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  )
    return { error: "needLocation" };
  if (!city || !country) return { error: "needPlace" };

  // The same tour link can only be listed once.
  const [sameUrl] = await db
    .select({ id: listings.id })
    .from(listings)
    .where(id ? and(eq(listings.tourUrl, tourUrl), ne(listings.id, id)) : eq(listings.tourUrl, tourUrl))
    .limit(1);
  if (sameUrl) return { error: "duplicateUrl" };

  // When editing, the tour must be this member's; keep its old thumbnail
  // so it can be removed once replaced.
  let oldThumbnail: string | null = null;
  if (id) {
    const [own] = await db
      .select({ thumbnailPath: listings.thumbnailPath })
      .from(listings)
      .where(and(eq(listings.id, id), eq(listings.memberId, memberId)))
      .limit(1);
    if (!own) return { error: "notFound" };
    oldThumbnail = own.thumbnailPath;
  }

  // A new image replaces the old one; "removeThumbnail" clears it.
  const upload = form.get("thumbnail");
  let newThumbnail: string | null = null;
  if (upload instanceof File && upload.size > 0) {
    const saved = await saveThumbnail(upload);
    if ("error" in saved) return { error: saved.error };
    newThumbnail = saved.stored;
  }
  const removeThumbnail = form.get("removeThumbnail") === "1";

  const values = {
    title,
    tourUrl,
    categorySlug: category,
    platform,
    city,
    country,
    lat: Math.round(lat * 1e6) / 1e6,
    lng: Math.round(lng * 1e6) / 1e6,
    ...(newThumbnail || removeThumbnail ? { thumbnailPath: newThumbnail } : {}),
  };

  try {
    if (id) {
      await db
        .update(listings)
        .set(values)
        .where(and(eq(listings.id, id), eq(listings.memberId, memberId)));
      if (newThumbnail || removeThumbnail) await deleteThumbnail(oldThumbnail);
    } else {
      const base = slugify(`${title} ${city}`, "tour");
      const taken = new Set(
        (
          await db
            .select({ slug: listings.slug })
            .from(listings)
            .where(like(listings.slug, `${base}%`))
        ).map((row) => row.slug),
      );
      await db.insert(listings).values({
        ...values,
        slug: nextFreeSlug(base, taken),
        memberId,
        status: "live",
      });
    }
  } catch (error) {
    // Nothing points at the new image if saving failed.
    await deleteThumbnail(newThumbnail);
    if (isDuplicate(error)) return { error: "duplicateUrl" };
    console.error(error);
    return { error: "generic" };
  }

  updateTag("listings");
  redirect(`/${locale}/account#tours`);
}

export async function deleteTour(form: FormData) {
  const locale = localeOf(form);
  const memberId = await currentMemberId(locale);
  const id = Number(form.get("id"));
  if (memberId && Number.isSafeInteger(id)) {
    const [own] = await db
      .select({ thumbnailPath: listings.thumbnailPath })
      .from(listings)
      .where(and(eq(listings.id, id), eq(listings.memberId, memberId)))
      .limit(1);
    if (own) {
      await db
        .delete(listings)
        .where(and(eq(listings.id, id), eq(listings.memberId, memberId)));
      await deleteThumbnail(own.thumbnailPath);
      updateTag("listings");
    }
  }
  redirect(`/${locale}/account#tours`);
}
