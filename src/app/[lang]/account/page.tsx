import type { Metadata } from "next";
import { Suspense } from "react";
import DarkPage, { DarkHeading } from "@/components/DarkPage";
import ProfileForm from "@/components/ProfileForm";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { signOut } from "@/lib/actions";
import { platformOptions } from "@/lib/platforms";
import { getMemberForUser, requireUser } from "@/lib/session";

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

      <div className="mt-16">
        <DarkHeading>{a.toursTitle}</DarkHeading>
        <p className="text-white/50">{a.toursSoon}</p>
      </div>
    </>
  );
}
