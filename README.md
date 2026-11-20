# 360atlas web

The 360atlas.net site: a worldwide, multilingual directory of 360° virtual tours.
The concept, pricing and roadmap are in `../docs/`.

It runs entirely on Hostinger Business Web Hosting: Next.js as a Node.js web app,
with MariaDB 10.5 as the database. Sign-in, accounts and data all stay on that plan.

## Run it locally

1. **Start the database.** MariaDB 10.5 lives in `../mariadb` (outside this repo):

   ```bash
   npm run db:local
   ```

   Leave it running in its own terminal.

2. **Settings.** `.env.local` (never committed) holds:

   ```
   DATABASE_URL=mysql://atlas:PASSWORD@127.0.0.1:3306/atlas
   BETTER_AUTH_SECRET=long-random-string
   BETTER_AUTH_URL=http://localhost:3000
   ```

3. **Create the tables and load the sample data** (first time, or after schema changes):

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Run the site:**

   ```bash
   npm run dev
   ```

Open http://localhost:3000. The root redirects to `/en`, `/ar`, `/es` or `/fr` based on the browser language.

## What exists

- **Public area** under `src/app/[lang]/`: home, map, categories, tour pages, creator directory and profiles, membership, about, contact.
- **Accounts**: sign up, sign in and sign out (`/sign-up`, `/sign-in`), and `/account`, where members create and edit their public profile and set where they work on a map.
- **Click redirect** at `/go/{id}`: every "Open the tour" click goes through it so opens can be counted.
- **Translations** in `src/i18n/dictionaries/` (English, Arabic, Spanish, French).

## Database

- Schema: `src/db/schema.ts` (Drizzle ORM). After changing it, run `npm run db:generate` to write a new SQL file to `db/migrations/`, then `npm run db:migrate`.
- The SQL files in `db/migrations/` are plain MariaDB SQL, so they can also be imported through phpMyAdmin on Hostinger.
- Public pages read through `src/lib/data.ts`. Results are cached and tagged `listings` / `members`; code that changes those tables must call `updateTag(...)`.
- Sign-in is Better Auth (`src/lib/auth.ts`), a library inside the app. Its tables (`user`, `session`, `account`, `verification`) are in the same database.
- Sample listings in `src/data/seed.ts` are placeholders; their tour links point at example.com.

Not built yet: adding and editing tours, thumbnails, Stripe subscriptions, enquiries, the admin panel, email sending and the link checker.

## Notes

- The map uses MapLibre with OpenFreeMap tiles (no API key). Its worker file is copied into `public/` by `npm run copy-map-worker`, which runs before `dev` and `build`.
- This is Next.js 16 with Cache Components. Read `AGENTS.md` before changing routing or data fetching.
- `npm run build` needs the database running, because pages are prerendered from it.
