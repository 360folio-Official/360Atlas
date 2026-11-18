import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DarkPage from "@/components/DarkPage";
import TourCard from "@/components/TourCard";
import { getDictionary } from "@/i18n/dictionaries";
import { getCategories, getCategory, getListingsByCategory } from "@/lib/data";

export function generateStaticParams() {
  return getCategories().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/categories/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { dict } = await getDictionary();
  const category = getCategory(slug);
  return { title: category ? dict.categories[category.slug] : undefined };
}

export default async function CategoryPage({
  params,
}: PageProps<"/[lang]/categories/[slug]">) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const { locale, dict } = await getDictionary();
  const name = dict.categories[category.slug];
  const listings = getListingsByCategory(category.slug);

  return (
    <DarkPage
      eyebrow={{ label: dict.categoriesPage.title, href: `/${locale}/categories` }}
      hue={category.hue}
      title={
        <span className="flex items-center gap-4">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl shadow-lg sm:h-20 sm:w-20 sm:text-5xl"
            style={{
              background: `linear-gradient(135deg, hsl(${category.hue} 55% 42%), hsl(${(category.hue + 40) % 360} 60% 22%))`,
            }}
            aria-hidden
          >
            {category.icon}
          </span>
          {name}
        </span>
      }
      intro={
        <span className="inline-flex items-center gap-2">
          <span className="live-dot" aria-hidden />
          {listings.length} {dict.categoriesPage.tours}
        </span>
      }
    >
      {listings.length === 0 ? (
        <p className="text-white/60">{dict.categoriesPage.empty}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <TourCard
              key={listing.id}
              listing={listing}
              locale={locale}
              categoryName={name}
              dark
            />
          ))}
        </div>
      )}
    </DarkPage>
  );
}
