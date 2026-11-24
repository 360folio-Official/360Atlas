import Link from "next/link";
import { Suspense } from "react";
import DarkPage from "@/components/DarkPage";
import TourForm from "@/components/TourForm";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { getCategories } from "@/lib/categories";
import { tourPlatformOptions } from "@/lib/platforms";
import { getMemberForUser, getMemberTour, requireUser } from "@/lib/session";

// The Add a tour and Edit tour pages. `tourId` is a promise so the page's
// params are read inside the Suspense boundary, per request.
export default function TourEditor({
  locale,
  dict,
  tourId,
}: {
  locale: Locale;
  dict: Dictionary;
  tourId?: Promise<string>;
}) {
  const t = dict.tours;
  return (
    <DarkPage
      eyebrow={{ label: t.back, href: `/${locale}/account#tours` }}
      title={tourId ? t.editTitle : t.newTitle}
      intro={t.intro}
    >
      <Suspense fallback={<p className="text-white/50">{dict.auth.pending}</p>}>
        <EditorContent locale={locale} dict={dict} tourId={tourId} />
      </Suspense>
    </DarkPage>
  );
}

async function EditorContent({
  locale,
  dict,
  tourId,
}: {
  locale: Locale;
  dict: Dictionary;
  tourId?: Promise<string>;
}) {
  const t = dict.tours;
  const user = await requireUser(locale);
  const profile = await getMemberForUser(user.id);
  const back = (
    <Link href={`/${locale}/account`} className="font-semibold text-glow hover:text-white">
      {t.back}
    </Link>
  );
  if (!profile)
    return (
      <p className="text-white/60">
        {t.needProfile} {back}
      </p>
    );

  const tour = tourId ? await getMemberTour(profile.id, Number(await tourId)) : null;
  if (tourId && !tour)
    return (
      <p className="text-white/60">
        {t.notFound} {back}
      </p>
    );

  return (
    <TourForm
      locale={locale}
      tour={tour}
      categories={getCategories().map(({ slug, icon }) => ({
        slug,
        icon,
        name: dict.categories[slug],
      }))}
      platforms={tourPlatformOptions}
      labels={{ ...t, generic: dict.auth.errors.generic }}
    />
  );
}
