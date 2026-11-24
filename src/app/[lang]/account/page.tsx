import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import DarkPage, { DarkHeading } from "@/components/DarkPage";
import ProfileForm from "@/components/ProfileForm";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { signOut } from "@/lib/actions";
import { platformOptions } from "@/lib/platforms";
import { getCategory } from "@/lib/categories";
import { getMemberForUser, getMemberTours, requireUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.account.title, robots: { index: false } };
}

export default async function AccountPage() {
  const { locale, dict } = await getDictionary();

  return (
    <DarkPage title={dict.account.title}>
      {/* Everything below reads the session, so it streams in per request. */}
      <Suspense fallback={<p className="text-white/50">{dict.auth.pending}</p>}>
        <AccountContent locale={locale} dict={dict} />
      </Suspense>
    </DarkPage>
  );
}

async function AccountContent({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const user = await requireUser(locale);
  const profile = await getMemberForUser(user.id);
  const a = dict.account;

  return (
    <>
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
        <p className="text-sm text-white/60">
          {a.welcome}{" "}
          <span className="font-semibold text-white">{user.name}</span>{" "}
          <span dir="ltr">({user.email})</span>
        </p>
        <form action={signOut}>
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/80 transition hover:border-white hover:text-white"
          >
            {dict.auth.signOut}
          </button>
        </form>
      </div>

      <DarkHeading>{a.profileTitle}</DarkHeading>
      <p className="-mt-2 mb-8 max-w-2xl text-white/60">
        {profile ? a.profileIntro : a.createIntro}
      </p>
      <ProfileForm
        locale={locale}
        profile={profile}
        platformOptions={platformOptions}
        labels={{ ...a, generic: dict.auth.errors.generic }}
      />

      <div id="tours" className="mt-16 scroll-mt-20">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <DarkHeading>{a.toursTitle}</DarkHeading>
          {profile && (
            <Link
              href={`/${locale}/account/tours/new`}
              className="-mt-6 rounded-full bg-glow px-5 py-2 text-sm font-semibold text-ink transition hover:bg-white"
            >
              + {dict.tours.add}
            </Link>
          )}
        </div>
        {profile ? (
          <MyTours memberId={profile.id} locale={locale} dict={dict} />
        ) : (
          <p className="text-white/50">{dict.tours.needProfile}</p>
        )}
      </div>
    </>
  );
}

const statusStyle = {
  live: "bg-emerald-400/15 text-emerald-200",
  pending: "bg-amber-400/15 text-amber-200",
  hidden: "bg-white/10 text-white/60",
  broken_link: "bg-red-500/15 text-red-200",
} as const;

async function MyTours({
  memberId,
  locale,
  dict,
}: {
  memberId: number;
  locale: Locale;
  dict: Dictionary;
}) {
  const tours = await getMemberTours(memberId);
  const t = dict.tours;
  if (!tours.length) return <p className="text-white/50">{t.none}</p>;

  return (
    <ul className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03]">
      {tours.map((tour) => {
        const category = getCategory(tour.category);
        return (
          <li key={tour.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4">
            <span className="text-2xl" aria-hidden>
              {category?.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{tour.title}</p>
              <p className="text-sm text-white/55">
                {category && dict.categories[category.slug]} · {tour.city}, {tour.country}
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle[tour.status]}`}>
              {t.status[tour.status]}
            </span>
            <div className="flex gap-4 text-sm font-semibold">
              {tour.status === "live" && (
                <Link href={`/${locale}/tours/${tour.slug}`} className="text-white/70 hover:text-white">
                  {t.view}
                </Link>
              )}
              <Link
                href={`/${locale}/account/tours/${tour.id}`}
                className="text-glow hover:text-white"
              >
                {t.edit}
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
