// Loads the sample categories, creators and tours into the database.
// Safe to run more than once: rows are matched on their slug and updated.
//   npm run db:seed
import { drizzle } from "drizzle-orm/mysql2";
import { eq, sql } from "drizzle-orm";
import mysql from "mysql2/promise";
import * as schema from "../src/db/schema";
import { categories, listings, providers } from "../src/data/seed";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Fall back to variables already in the environment.
}

async function main() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    timezone: "Z",
  });
  const db = drizzle(connection, { schema, mode: "default" });

  await db.transaction(async (tx) => {
    for (const [sortOrder, category] of categories.entries()) {
      await tx
        .insert(schema.categories)
        .values({ ...category, sortOrder })
        .onDuplicateKeyUpdate({
          set: { icon: category.icon, hue: category.hue, sortOrder },
        });
    }

    const memberIds = new Map<string, number>();
    for (const provider of providers) {
      const values = {
        slug: provider.slug,
        type: "provider" as const,
        businessName: provider.name,
        bio: provider.bio,
        platforms: provider.platforms,
        languages: [],
        verified: provider.verified,
        featured: provider.featured,
      };
      await tx
        .insert(schema.members)
        .values(values)
        .onDuplicateKeyUpdate({ set: values });
      const [member] = await tx
        .select({ id: schema.members.id })
        .from(schema.members)
        .where(eq(schema.members.slug, provider.slug));
      memberIds.set(provider.slug, member.id);

      // One service area per sample creator: replace it each run.
      await tx
        .delete(schema.serviceAreas)
        .where(eq(schema.serviceAreas.memberId, member.id));
      await tx.insert(schema.serviceAreas).values({
        memberId: member.id,
        label: provider.city,
        city: provider.city,
        country: provider.country,
        lat: provider.lat,
        lng: provider.lng,
        radiusKm: provider.radiusKm,
      });
    }

    for (const listing of listings) {
      const values = {
        slug: listing.slug,
        memberId: memberIds.get(listing.providerSlug) ?? null,
        title: listing.title,
        categorySlug: listing.category,
        tourUrl: listing.tourUrl,
        platform: listing.platform,
        lat: listing.lat,
        lng: listing.lng,
        city: listing.city,
        country: listing.country,
        status: "live" as const,
        featured: listing.featured,
        seeded: true,
        createdAt: new Date(`${listing.addedAt}T12:00:00Z`),
      };
      await tx
        .insert(schema.listings)
        .values(values)
        .onDuplicateKeyUpdate({ set: values });
    }

    // Drop categories that left the list, unless a tour still uses one.
    const keep = categories.map((c) => c.slug);
    await tx.execute(sql`
      delete from ${schema.categories}
      where ${schema.categories.slug} not in (${sql.join(keep.map((s) => sql`${s}`), sql`, `)})
        and ${schema.categories.slug} not in (select ${schema.listings.categorySlug} from ${schema.listings})
    `);
  });

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.listings);
  console.log(
    `Seeded ${categories.length} categories, ${providers.length} creators; ${count} tours in the database.`,
  );
  await connection.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
