import type { Metadata } from "next";
import Link from "next/link";
import DarkPage from "@/components/DarkPage";
import { getDictionary } from "@/i18n/dictionaries";
import { getCategories, getListingsByCategory } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.categoriesPage.title };
}

export default async function CategoriesPage() {
  const { locale, dict } = await getDictionary();

  return (
    <DarkPage
      title={dict.categoriesPage.title}
      intro={dict.categoriesPage.intro}
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {getCategories().map((category) => (
          <Link
            key={category.slug}
            href={`/${locale}/categories/${category.slug}`}
            className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-white/10 p-5 transition duration-300 hover:-translate-y-1 hover:border-white/30 hover:shadow-[0_24px_60px_-24px] hover:shadow-glow/40"
            style={{
              background: `linear-gradient(150deg, hsl(${category.hue} 50% 36%), hsl(${(category.hue + 40) % 360} 55% 14%) 75%)`,
            }}
          >
            <span
              className="absolute -end-4 -top-4 text-8xl opacity-25 transition duration-500 group-hover:-rotate-6 group-hover:scale-110 group-hover:opacity-45"
              aria-hidden
            >
              {category.icon}
            </span>
            <span className="relative text-4xl" aria-hidden>
              {category.icon}
            </span>
            <span className="relative mt-3 text-lg font-semibold leading-snug">
              {dict.categories[category.slug]}
            </span>
            <span className="relative mt-0.5 text-sm text-white/65">
              {getListingsByCategory(category.slug).length}{" "}
              {dict.categoriesPage.tours}
              <span className="ms-2 inline-block opacity-0 transition group-hover:opacity-100 rtl:rotate-180">
                →
              </span>
            </span>
          </Link>
        ))}
      </div>
    </DarkPage>
  );
}
