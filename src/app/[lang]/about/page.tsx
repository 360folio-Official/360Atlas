import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.about.title };
}

export default async function AboutPage() {
  const { dict } = await getDictionary();

  return (
    <PageShell title={dict.about.title}>
      <div className="max-w-2xl space-y-4 text-lg leading-relaxed">
        <p>{dict.about.p1}</p>
        <p>{dict.about.p2}</p>
        <p>{dict.about.p3}</p>
      </div>
    </PageShell>
  );
}
