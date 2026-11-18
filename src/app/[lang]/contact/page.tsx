import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.contact.title };
}

const field =
  "mt-1 w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand";

export default async function ContactPage() {
  const { dict } = await getDictionary();
  const c = dict.contact;

  return (
    <PageShell title={c.title} intro={c.intro}>
      <form className="max-w-xl space-y-4">
        <label className="block text-sm font-medium">
          {c.name}
          <input type="text" name="name" className={field} />
        </label>
        <label className="block text-sm font-medium">
          {c.email}
          <input type="email" name="email" className={field} />
        </label>
        <label className="block text-sm font-medium">
          {c.message}
          <textarea name="message" rows={5} className={field} />
        </label>
        <button
          type="button"
          disabled
          className="rounded-full bg-brand px-6 py-3 font-semibold text-white opacity-60"
        >
          {c.send}
        </button>
        <p className="text-xs text-muted">{c.soon}</p>
      </form>
    </PageShell>
  );
}
