import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { getDictionary } from "@/i18n/dictionaries";
import { getCategories, getListingsByCategory } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.categoriesPage.title };
}

export default async function CategoriesPage() {
  const { locale, dict } = await getDictionary();

  return (
    <PageShell
      title={dict.categoriesPage.title}
      intro={dict.categoriesPage.intro}
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {getCategories().map((category) => (
          <Link
            key={category.slug}
            href={`/${locale}/categories/${category.slug}`}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className="text-5xl" aria-hidden>
              {category.icon}
            </span>
            <span className="font-semibold text-ink">
              {dict.categories[category.slug]}
            </span>
            <span className="text-sm text-muted">
              {getListingsByCategory(category.slug).length}{" "}
              {dict.categoriesPage.tours}
            </span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
