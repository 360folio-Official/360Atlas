// 360atlas database schema for MariaDB 10.5 (Hostinger Business hosting).
// Change this file, then run `npm run db:generate` to write a migration and
// `npm run db:migrate` to apply it.
import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  customType,
  datetime,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

// MariaDB stores JSON as text, so parse and stringify it ourselves.
const jsonText = <T>(name: string) =>
  customType<{ data: T; driverData: string }>({
    dataType: () => "text",
    toDriver: (value) => JSON.stringify(value),
    fromDriver: (value) => JSON.parse(value) as T,
  })(name);

const now = () => new Date();
// MariaDB needs the precision on the default to match the column's.
const nowMs = sql`CURRENT_TIMESTAMP(3)`;
const createdAt = () => timestamp("createdAt", { fsp: 3 }).notNull().default(nowMs);
const updatedAt = () =>
  timestamp("updatedAt", { fsp: 3 }).notNull().default(nowMs).$onUpdate(now);

// ---------------------------------------------------------------------------
// Sign-in (tables used by Better Auth; column names must stay as they are).
// ---------------------------------------------------------------------------

export const user = mysqlTable("user", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  role: mysqlEnum("role", ["member", "admin"]).notNull().default("member"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = mysqlTable(
  "session",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    expiresAt: timestamp("expiresAt", { fsp: 3 }).notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: varchar("userId", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_userId_idx").on(t.userId)],
);

export const account = mysqlTable(
  "account",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: varchar("userId", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { fsp: 3 }),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { fsp: 3 }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("account_userId_idx").on(t.userId)],
);

export const verification = mysqlTable(
  "verification",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt", { fsp: 3 }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// ---------------------------------------------------------------------------
// Directory
// ---------------------------------------------------------------------------

export const categories = mysqlTable("categories", {
  slug: varchar("slug", { length: 40 }).primaryKey(),
  icon: varchar("icon", { length: 16 }).notNull().default(""),
  hue: smallint("hue").notNull().default(200),
  sortOrder: int("sortOrder").notNull().default(0),
});

// One row per business profile. `userId` is null for profiles the admin
// seeded that nobody has claimed yet.
export const members = mysqlTable(
  "members",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: varchar("userId", { length: 36 })
      .unique()
      .references(() => user.id, { onDelete: "set null" }),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    type: mysqlEnum("type", ["provider", "owner"]).notNull().default("provider"),
    businessName: varchar("businessName", { length: 160 }).notNull(),
    contactName: varchar("contactName", { length: 160 }),
    bio: text("bio"),
    websiteUrl: varchar("websiteUrl", { length: 500 }),
    logoPath: varchar("logoPath", { length: 300 }),
    platforms: jsonText<string[]>("platforms").notNull(),
    languages: jsonText<string[]>("languages").notNull(),
    verified: boolean("verified").notNull().default(false),
    featured: boolean("featured").notNull().default(false),
    plan: mysqlEnum("plan", ["free", "pro", "business"]).notNull().default("free"),
    claimedAt: datetime("claimedAt"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("members_type_idx").on(t.type)],
);

// Where a member works: a point plus a radius. The first area is the one
// shown on their profile.
export const serviceAreas = mysqlTable(
  "service_areas",
  {
    id: int("id").autoincrement().primaryKey(),
    memberId: int("memberId")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 160 }).notNull(),
    city: varchar("city", { length: 120 }),
    country: varchar("country", { length: 120 }),
    lat: decimal("lat", { precision: 9, scale: 6, mode: "number" }).notNull(),
    lng: decimal("lng", { precision: 9, scale: 6, mode: "number" }).notNull(),
    radiusKm: int("radiusKm").notNull().default(50),
    sortOrder: int("sortOrder").notNull().default(0),
  },
  (t) => [
    index("service_areas_member_idx").on(t.memberId),
    index("service_areas_lat_lng_idx").on(t.lat, t.lng),
  ],
);

export const listings = mysqlTable(
  "listings",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    memberId: int("memberId").references(() => members.id, { onDelete: "set null" }),
    // The provider who shot the tour, when a venue owner lists it.
    creditedProviderId: int("creditedProviderId").references(() => members.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 200 }).notNull(),
    categorySlug: varchar("categorySlug", { length: 40 })
      .notNull()
      .references(() => categories.slug),
    tourUrl: varchar("tourUrl", { length: 700 }).notNull(),
    platform: varchar("platform", { length: 60 }).notNull(),
    thumbnailPath: varchar("thumbnailPath", { length: 300 }),
    // Null coordinates = virtual-only tour, kept off the map.
    lat: decimal("lat", { precision: 9, scale: 6, mode: "number" }),
    lng: decimal("lng", { precision: 9, scale: 6, mode: "number" }),
    address: varchar("address", { length: 300 }),
    city: varchar("city", { length: 120 }),
    country: varchar("country", { length: 120 }),
    websiteUrl: varchar("websiteUrl", { length: 500 }),
    bookingUrl: varchar("bookingUrl", { length: 500 }),
    status: mysqlEnum("status", ["pending", "live", "broken_link", "hidden"])
      .notNull()
      .default("pending"),
    featured: boolean("featured").notNull().default(false),
    seeded: boolean("seeded").notNull().default(false),
    lastCheckedAt: datetime("lastCheckedAt"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("listings_tour_url_idx").on(t.tourUrl),
    index("listings_lat_lng_idx").on(t.lat, t.lng),
    index("listings_category_status_idx").on(t.categorySlug, t.status),
    index("listings_member_idx").on(t.memberId),
    index("listings_created_idx").on(t.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// Enquiries, click tracking, subscriptions
// ---------------------------------------------------------------------------

export const enquiries = mysqlTable(
  "enquiries",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    memberId: int("memberId")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    listingId: bigint("listingId", { mode: "number", unsigned: true }).references(
      () => listings.id,
      { onDelete: "set null" },
    ),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    message: text("message").notNull(),
    createdAt: createdAt(),
    readAt: datetime("readAt"),
  },
  (t) => [index("enquiries_member_idx").on(t.memberId, t.createdAt)],
);

export const clickEvents = mysqlTable(
  "click_events",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    listingId: bigint("listingId", { mode: "number", unsigned: true })
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    kind: mysqlEnum("kind", ["view", "tour_open", "website", "booking"]).notNull(),
    locale: varchar("locale", { length: 8 }),
    createdAt: createdAt(),
  },
  (t) => [index("click_events_listing_idx").on(t.listingId, t.createdAt)],
);

// Mirrored from the payment provider's webhooks once billing is added.
export const subscriptions = mysqlTable(
  "subscriptions",
  {
    memberId: int("memberId")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
    customerId: varchar("customerId", { length: 120 }).notNull().unique(),
    subscriptionId: varchar("subscriptionId", { length: 120 }).unique(),
    plan: mysqlEnum("plan", ["free", "pro", "business"]).notNull().default("free"),
    status: varchar("status", { length: 40 }).notNull(),
    currentPeriodEnd: datetime("currentPeriodEnd"),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.memberId] })],
);

// ---------------------------------------------------------------------------
// Relations (for typed joins)
// ---------------------------------------------------------------------------

export const membersRelations = relations(members, ({ many, one }) => ({
  user: one(user, { fields: [members.userId], references: [user.id] }),
  serviceAreas: many(serviceAreas),
  listings: many(listings),
}));

export const serviceAreasRelations = relations(serviceAreas, ({ one }) => ({
  member: one(members, { fields: [serviceAreas.memberId], references: [members.id] }),
}));

export const listingsRelations = relations(listings, ({ one }) => ({
  member: one(members, { fields: [listings.memberId], references: [members.id] }),
  category: one(categories, {
    fields: [listings.categorySlug],
    references: [categories.slug],
  }),
}));
