import type { Metadata } from "next";
import TourEditor from "@/components/TourEditor";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.tours.newTitle, robots: { index: false } };
}

export default async function NewTourPage() {
  const { locale, dict } = await getDictionary();
  return <TourEditor locale={locale} dict={dict} />;
}
