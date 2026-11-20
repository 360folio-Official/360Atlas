import Link from "next/link";
import { Suspense } from "react";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { getCurrentUser } from "@/lib/session";
import LocaleSwitcher from "./LocaleSwitcher";
import Logo from "./Logo";

export default async function Header() {
  const { locale, dict } = await getDictionary();
  const links = [
    { href: `/${locale}/map`, label: dict.nav.map },
    { href: `/${locale}/categories`, label: dict.nav.categories },
    { href: `/${locale}/providers`, label: dict.nav.providers },
    { href: `/${locale}/membership`, label: dict.nav.membership },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/90 text-white backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3">
        <Logo href={`/${locale}`} />
        <nav className="order-3 flex w-full gap-6 overflow-x-auto no-scrollbar text-sm font-medium text-white/65 sm:order-none sm:w-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-3">
          <LocaleSwitcher current={locale} label={dict.footer.language} />
          {/* The session is read per request, so it streams in after the shell. */}
          <Suspense fallback={<SignedOutLinks locale={locale} dict={dict} />}>
            <AccountLinks locale={locale} dict={dict} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

const ctaClass =
  "rounded-full bg-glow px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white";

function SignedOutLinks({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <>
      <Link
        href={`/${locale}/sign-in`}
        className="whitespace-nowrap text-sm font-medium text-white/70 transition hover:text-white"
      >
        {dict.nav.signIn}
      </Link>
      <Link href={`/${locale}/sign-up`} className={ctaClass}>
        {dict.nav.listTour}
      </Link>
    </>
  );
}

async function AccountLinks({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const user = await getCurrentUser();
  if (!user) return <SignedOutLinks locale={locale} dict={dict} />;
  return (
    <Link href={`/${locale}/account`} className={ctaClass}>
      {dict.auth.account}
    </Link>
  );
}
