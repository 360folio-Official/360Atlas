import Link from "next/link";
import Carousel, { Slide } from "@/components/Carousel";
import HeroGlobe from "@/components/HeroGlobe";
import ProviderCard from "@/components/ProviderCard";
import SpiralCategories from "@/components/spiral/SpiralCategories";
import TourCard from "@/components/TourCard";
import { getDictionary } from "@/i18n/dictionaries";
import {
  getCategories,
  getFeaturedListings,
  getFeaturedProviders,
  getLatestListings,
  getCategoryCounts,
  getListings,
  getProviders,
} from "@/lib/data";
import { toGlobePoints } from "@/lib/map-points";

export default async function HomePage() {
  const { locale, dict } = await getDictionary();
  const h = dict.home;
  const categoryName = (slug: keyof typeof dict.categories) =>
    dict.categories[slug];

  const [listings, providers, featured, latest, featuredProviders, counts] =
    await Promise.all([
      getListings(),
      getProviders(),
      getFeaturedListings(),
      getLatestListings(),
      getFeaturedProviders(),
      getCategoryCounts(),
    ]);
  const stats = [
    { value: listings.length, label: h.statTours },
    { value: new Set(listings.map((l) => l.country)).size, label: h.statCountries },
    { value: providers.length, label: h.statCreators },
  ];

  const heroPoints = toGlobePoints(listings, categoryName);

  // The 8 categories with the most tours; the categories page lists them all.
  const topCategories = getCategories()
    .map((category, order) => ({ category, order }))
    .sort((a, b) => (counts[b.category.slug] ?? 0) - (counts[a.category.slug] ?? 0) || a.order - b.order)
    .slice(0, 8)
    .map(({ category }) => category);

  const steps = [
    { n: "01", title: h.how1Title, text: h.how1Text },
    { n: "02", title: h.how2Title, text: h.how2Text },
    { n: "03", title: h.how3Title, text: h.how3Text },
  ];

  return (
    <>
      <section className="hero-space relative isolate h-[calc(100svh-4rem)] min-h-[620px] overflow-hidden text-white">
        <HeroGlobe
          points={heroPoints}
          locale={locale}
          nowShowingLabel={h.nowShowing}
          viewTourLabel={h.viewTour}
        />

        {/* Keeps the headline readable over the globe. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/90 via-ink/30 to-transparent lg:bg-gradient-to-r lg:via-ink/50 rtl:lg:bg-gradient-to-l"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink to-transparent"
        />

        <div className="pointer-events-none relative mx-auto flex h-full max-w-6xl flex-col px-4 pt-10 sm:pt-16 lg:justify-center lg:pt-0">
          <div className="pointer-events-auto max-w-xl">
            <p
              className="rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-200 backdrop-blur"
              style={{ "--d": "200ms" } as React.CSSProperties}
            >
              <span className="live-dot" aria-hidden />
              {h.eyebrow}
            </p>

            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              {h.heroTitle.split(" ").map((word, i) => (
                <span
                  key={i}
                  className="rise inline-block"
                  style={{ "--d": `${450 + i * 110}ms` } as React.CSSProperties}
                >
                  {word}&nbsp;
                </span>
              ))}
            </h1>

            <p
              className="rise mt-5 max-w-xl text-lg font-medium text-white/85 sm:text-2xl"
              style={{ "--d": "1200ms" } as React.CSSProperties}
            >
              {h.heroText}
            </p>

            <div
              className="rise mt-8 flex flex-wrap gap-3"
              style={{ "--d": "1450ms" } as React.CSSProperties}
            >
              <Link
                href={`/${locale}/membership`}
                className="rounded-full bg-glow px-6 py-3 font-semibold text-ink shadow-[0_0_40px_-8px] shadow-glow/70 transition hover:bg-white"
              >
                {h.listFree}
              </Link>
              <Link
                href={`/${locale}/map`}
                className="rounded-full border border-white/25 bg-white/5 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/15"
              >
                {h.exploreMap}
              </Link>
            </div>

            <dl
              className="rise mt-10 hidden gap-8 sm:flex"
              style={{ "--d": "1700ms" } as React.CSSProperties}
            >
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="text-3xl font-bold tabular-nums">{s.value}</dd>
                  <dd className="text-sm text-white/55">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <a
          href="#discover"
          className="scroll-cue absolute bottom-6 start-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-xs text-white/50 hover:text-white lg:flex rtl:translate-x-1/2"
        >
          {h.scroll}
          <span aria-hidden>↓</span>
        </a>
      </section>

      <div id="discover" className="scroll-mt-16">
        <Carousel
          title={h.featured}
          href={`/${locale}/map`}
          linkLabel={h.viewAll}
        >
          {featured.map((listing) => (
            <Slide key={listing.id}>
              <TourCard
                listing={listing}
                locale={locale}
                categoryName={categoryName(listing.category)}
              />
            </Slide>
          ))}
        </Carousel>
      </div>

      <SpiralCategories
        categories={getCategories().map((category) => ({
          ...category,
          name: categoryName(category.slug),
          count: counts[category.slug] ?? 0,
        }))}
        locale={locale}
        title={h.categories}
        hint={h.categoriesHint}
        toursLabel={dict.categoriesPage.tours}
        exploreLabel={h.exploreCategory}
        viewAllLabel={h.viewAll}
      />

      {/* Phones, touch screens and reduced motion get the grid instead. */}
      <section className="spiral-hide mx-auto mt-16 max-w-6xl px-4">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {h.categories}
          </h2>
          <Link
            href={`/${locale}/categories`}
            className="shrink-0 text-sm font-semibold text-brand hover:text-brand-strong"
          >
            {h.viewAll}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {topCategories.map((category) => (
            <Link
              key={category.slug}
              href={`/${locale}/categories/${category.slug}`}
              className="group relative overflow-hidden rounded-2xl p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                background: `linear-gradient(145deg, hsl(${category.hue} 50% 38%), hsl(${(category.hue + 40) % 360} 55% 18%))`,
              }}
            >
              <span
                className="absolute -end-3 -top-3 text-7xl opacity-25 transition group-hover:scale-110 group-hover:opacity-40"
                aria-hidden
              >
                {category.icon}
              </span>
              <span className="relative block text-3xl" aria-hidden>
                {category.icon}
              </span>
              <span className="relative mt-6 block font-semibold leading-snug">
                {categoryName(category.slug)}
              </span>
              <span className="relative text-xs text-white/70">
                {counts[category.slug] ?? 0}{" "}
                {dict.categoriesPage.tours}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-4">
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {h.howTitle}
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {steps.map((step) => (
            <li
              key={step.n}
              className="rounded-2xl border border-border bg-surface p-6 shadow-sm"
            >
              <span className="font-mono text-sm font-semibold text-brand">
                {step.n}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <Carousel title={h.latest}>
        {latest.map((listing) => (
          <Slide key={listing.id}>
            <TourCard
              listing={listing}
              locale={locale}
              categoryName={categoryName(listing.category)}
            />
          </Slide>
        ))}
      </Carousel>

      <Carousel
        title={h.providers}
        href={`/${locale}/providers`}
        linkLabel={h.viewAll}
      >
        {featuredProviders.map((provider) => (
          <Slide key={provider.slug}>
            <ProviderCard
              provider={provider}
              locale={locale}
              verifiedLabel={dict.providersPage.verified}
            />
          </Slide>
        ))}
      </Carousel>

      <section className="mx-auto mt-20 max-w-6xl px-4">
        <div className="hero-space relative overflow-hidden rounded-3xl px-6 py-12 text-white sm:px-12 sm:py-16">
          <div
            aria-hidden
            className="absolute -end-24 -top-24 h-72 w-72 rounded-full border border-glow/20 shadow-[0_0_120px_10px] shadow-glow/20"
          />
          <div
            aria-hidden
            className="absolute -end-10 -top-10 h-44 w-44 rounded-full border border-glow/30"
          />
          <h2 className="relative max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">
            {h.ctaTitle}
          </h2>
          <p className="relative mt-3 max-w-xl text-white/70">{h.ctaText}</p>
          <Link
            href={`/${locale}/membership`}
            className="relative mt-8 inline-block rounded-full bg-glow px-6 py-3 font-semibold text-ink transition hover:bg-white"
          >
            {h.ctaButton}
          </Link>
        </div>
      </section>
    </>
  );
}
