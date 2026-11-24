"use client";

import { useRouter } from "next/navigation";
import { localeNames, locales, type Locale } from "@/i18n/config";

export default function LocaleSwitcher({
  current,
  label,
}: {
  current: Locale;
  label: string;
}) {
  const router = useRouter();

  return (
    <select
      aria-label={label}
      value={current}
      onChange={(event) => {
        // Read the address only when switching, so pages with ids in their
        // address (like /account/tours/12) can still be prepared ahead of time.
        const rest = window.location.pathname.split("/").slice(2).join("/");
        router.push(`/${event.target.value}${rest ? `/${rest}` : ""}`);
      }}
      className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white [&>option]:text-foreground"
    >
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {localeNames[locale]}
        </option>
      ))}
    </select>
  );
}
