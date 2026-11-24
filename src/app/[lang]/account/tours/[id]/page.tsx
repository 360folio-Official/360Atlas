import type { Metadata } from "next";
import TourEditor from "@/components/TourEditor";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.tours.editTitle, robots: { index: false } };
}

export default async function EditTourPage({
  params,
}: PageProps<"/[lang]/account/tours/[id]">) {
  const { locale, dict } = await getDictionary();
  return <TourEditor locale={locale} dict={dict} tourId={params.then((p) => p.id)} />;
}
