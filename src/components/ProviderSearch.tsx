"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Provider } from "@/lib/data";
import ProviderCard from "./ProviderCard";

export default function ProviderSearch({
  providers,
  locale,
  labels,
}: {
  providers: Provider[];
  locale: Locale;
  labels: { searchPlaceholder: string; verified: string; empty: string };
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? providers.filter((p) =>
        `${p.city} ${p.country} ${p.name}`.toLowerCase().includes(needle),
      )
    : providers;

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={labels.searchPlaceholder}
        aria-label={labels.searchPlaceholder}
        className="w-full max-w-md rounded-full border border-border bg-surface px-5 py-3 text-sm shadow-sm outline-none focus:border-brand"
      />
      {matches.length === 0 ? (
        <p className="mt-8 text-muted">{labels.empty}</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((provider) => (
            <ProviderCard
              key={provider.slug}
              provider={provider}
              locale={locale}
              verifiedLabel={labels.verified}
            />
          ))}
        </div>
      )}
    </div>
  );
}
