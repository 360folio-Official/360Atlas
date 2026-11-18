import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import ProviderSearch from "@/components/ProviderSearch";
import { getDictionary } from "@/i18n/dictionaries";
import { getProviders } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.providersPage.title };
}

export default async function ProvidersPage() {
  const { locale, dict } = await getDictionary();
  const { searchPlaceholder, verified, empty } = dict.providersPage;

  return (
    <PageShell
      title={dict.providersPage.title}
      intro={dict.providersPage.intro}
    >
      <ProviderSearch
        providers={getProviders()}
        locale={locale}
        labels={{ searchPlaceholder, verified, empty }}
      />
    </PageShell>
  );
}
