# 360atlas web

The 360atlas.net site: a worldwide, multilingual directory of 360° virtual tours.
The concept, pricing and roadmap are in `../docs/`.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. The root redirects to `/en`, `/ar`, `/es` or `/fr` based on the browser language.

## What exists

- **Public area** under `src/app/[lang]/`: home, map, categories, tour pages, service providers, provider profiles, membership, about, contact.
- **Click redirect** at `/go/{id}`: every "Open the tour" click goes through it so opens can be counted.
- **Translations** in `src/i18n/dictionaries/` (English, Arabic, Spanish, French).
- **Database schema** in `supabase/migrations/0001_init.sql` (Postgres + PostGIS). Not applied anywhere yet.

## What is still sample data

The site reads from `src/data/seed.ts` through `src/lib/data.ts`. Every listing and provider there is a placeholder, and tour links point at example.com. Replace the functions in `src/lib/data.ts` with Supabase queries once a project is connected.

Not built yet: sign-in, the members area, Stripe subscriptions, enquiries, the admin panel and the link checker.

## Notes

- The map uses MapLibre with OpenFreeMap tiles (no API key). Its worker file is copied into `public/` by `npm run copy-map-worker`, which runs before `dev` and `build`.
- This is Next.js 16 with Cache Components. Read `AGENTS.md` before changing routing or data fetching.
