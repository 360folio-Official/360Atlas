import Link from "next/link";
import { getDictionary } from "@/i18n/dictionaries";
import Logo from "./Logo";

export default async function Footer() {
  const { locale, dict } = await getDictionary();
  const links = [
    { href: `/${locale}/map`, label: dict.nav.map },
    { href: `/${locale}/categories`, label: dict.nav.categories },
    { href: `/${locale}/providers`, label: dict.nav.providers },
    { href: `/${locale}/membership`, label: dict.nav.membership },
    { href: `/${locale}/about`, label: dict.nav.about },
    { href: `/${locale}/contact`, label: dict.nav.contact },
  ];

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <Logo href={`/${locale}`} />
          <p className="mt-3 max-w-xs text-sm text-white/55">
            {dict.footer.tagline}
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-x-10 gap-y-3 text-sm text-white/65 sm:grid-cols-3">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-white/40">
          © 2026 360atlas. {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
