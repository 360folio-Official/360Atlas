import type { Metadata } from "next";
import DarkPage from "@/components/DarkPage";
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
    <DarkPage
      title={dict.providersPage.title}
      intro={dict.providersPage.intro}
    >
      <ProviderSearch
        providers={await getProviders()}
        locale={locale}
        labels={{ searchPlaceholder, verified, empty }}
      />
    </DarkPage>
  );
}
