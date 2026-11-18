import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
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
    <PageShell
      title={`${category.icon} ${name}`}
      intro={`${listings.length} ${dict.categoriesPage.tours}`}
    >
      {listings.length === 0 ? (
        <p className="text-muted">{dict.categoriesPage.empty}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <TourCard
              key={listing.id}
              listing={listing}
              locale={locale}
              categoryName={name}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
