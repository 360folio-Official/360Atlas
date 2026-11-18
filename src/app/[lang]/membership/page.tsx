import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.membership.title };
}

export default async function MembershipPage() {
  const { dict } = await getDictionary();
  const m = dict.membership;
  const f = m.features;

  const tiers = [
    {
      name: m.free,
      desc: m.freeDesc,
      monthly: 0,
      yearly: 0,
      features: [f.listings5, f.directory, f.areas1, f.analyticsTotals],
      highlight: false,
    },
    {
      name: m.pro,
      desc: m.proDesc,
      monthly: 19,
      yearly: 190,
      features: [
        f.listingsUnlimited,
        f.directory,
        f.areas3,
        f.enquiries,
        f.links,
        f.analyticsFull,
        f.badge,
      ],
      highlight: true,
    },
    {
      name: m.business,
      desc: m.businessDesc,
      monthly: 59,
      yearly: 590,
      features: [
        f.listingsUnlimited,
        f.directory,
        f.areas10,
        f.enquiries,
        f.links,
        f.analyticsExport,
        f.badge,
        f.featured,
        f.carousel,
        f.priority,
      ],
      highlight: false,
    },
  ];

  return (
    <PageShell title={m.title} intro={m.intro}>
      <div className="grid gap-6 lg:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`flex flex-col rounded-2xl border bg-surface p-7 shadow-sm ${
              tier.highlight ? "border-brand ring-2 ring-brand/20" : "border-border"
            }`}
          >
            <h2 className="text-xl font-bold text-ink">{tier.name}</h2>
            <p className="mt-1 text-sm text-muted">{tier.desc}</p>
            <p className="mt-5">
              <span className="text-4xl font-bold text-ink" dir="ltr">
                ${tier.monthly}
              </span>{" "}
              <span className="text-sm text-muted">{m.perMonth}</span>
            </p>
            {tier.yearly > 0 && (
              <p className="mt-1 text-sm text-muted">
                <span dir="ltr">${tier.yearly}</span> {m.perYear}
              </p>
            )}
            <ul className="mt-6 flex-1 space-y-2 text-sm">
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="text-brand" aria-hidden>
                    ✓
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled
              className={`mt-7 rounded-full px-6 py-3 font-semibold opacity-60 ${
                tier.highlight
                  ? "bg-brand text-white"
                  : "border border-border text-ink"
              }`}
            >
              {m.choose}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-surface p-6">
        <h2 className="font-semibold text-ink">{m.lapseTitle}</h2>
        <p className="mt-1 text-sm text-muted">{m.lapseText}</p>
      </div>
    </PageShell>
  );
}
