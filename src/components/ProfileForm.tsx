"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveProfile, type FormState } from "@/lib/actions";
import type { MemberProfile } from "@/lib/session";
import { inputClass, keepValues } from "./AuthForm";
import LocationPicker from "./LocationPicker";

type Labels = Record<
  | "type"
  | "typeProvider"
  | "typeOwner"
  | "businessName"
  | "bio"
  | "website"
  | "platforms"
  | "languages"
  | "languagesHint"
  | "areaTitle"
  | "areaHint"
  | "city"
  | "country"
  | "radius"
  | "save"
  | "saving"
  | "saved"
  | "viewPublic"
  | "needLocation"
  | "needName"
  | "badWebsite"
  | "generic",
  string
>;

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="mb-1.5 block text-sm text-white/70">{label}</span>
    {children}
  </label>
);

export default function ProfileForm({
  locale,
  profile,
  platformOptions,
  labels,
}: {
  locale: string;
  profile: MemberProfile | null;
  platformOptions: string[];
  labels: Labels;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfile, {});
  const [radiusKm, setRadiusKm] = useState(profile?.area?.radiusKm ?? 50);
  const slug = state.slug ?? profile?.slug;

  return (
    <form method="post" onSubmit={keepValues(action)} className="grid gap-8 lg:grid-cols-2">
      <input type="hidden" name="locale" value={locale} />

      <div className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-sm text-white/70">{labels.type}</legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["provider", labels.typeProvider],
                ["owner", labels.typeOwner],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value={value}
                  defaultChecked={(profile?.type ?? "provider") === value}
                  className="peer sr-only"
                />
                <span className="block rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition peer-checked:border-glow peer-checked:bg-glow/15 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-glow">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Field label={labels.businessName}>
          <input
            name="businessName"
            required
            maxLength={160}
            defaultValue={profile?.businessName}
            className={inputClass}
          />
        </Field>

        <Field label={labels.bio}>
          <textarea
            name="bio"
            rows={4}
            maxLength={1200}
            defaultValue={profile?.bio}
            className={inputClass}
          />
        </Field>

        <Field label={labels.website}>
          <input
            name="websiteUrl"
            type="url"
            dir="ltr"
            placeholder="https://"
            defaultValue={profile?.websiteUrl}
            className={inputClass}
          />
        </Field>

        <fieldset>
          <legend className="mb-2 text-sm text-white/70">{labels.platforms}</legend>
          <div className="flex flex-wrap gap-2">
            {platformOptions.map((platform) => (
              <label key={platform} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="platforms"
                  value={platform}
                  defaultChecked={profile?.platforms.includes(platform)}
                  className="peer sr-only"
                />
                <span className="block rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/70 transition peer-checked:border-glow peer-checked:bg-glow/15 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-glow">
                  {platform}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Field label={labels.languages}>
          <input
            name="languages"
            defaultValue={profile?.languages.join(", ")}
            placeholder={labels.languagesHint}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold">{labels.areaTitle}</h3>
          <p className="mt-1 text-sm text-white/55">{labels.areaHint}</p>
        </div>
        <LocationPicker
          initial={profile?.area ? { lat: profile.area.lat, lng: profile.area.lng } : null}
          radiusKm={radiusKm}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={labels.city}>
            <input name="city" defaultValue={profile?.area?.city} className={inputClass} />
          </Field>
          <Field label={labels.country}>
            <input
              name="country"
              defaultValue={profile?.area?.country}
              className={inputClass}
            />
          </Field>
          <Field label={labels.radius}>
            <input
              name="radiusKm"
              type="number"
              min={1}
              max={2000}
              value={radiusKm}
              onChange={(event) => setRadiusKm(Number(event.target.value) || 1)}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 lg:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-glow px-8 py-3 font-semibold text-ink transition hover:bg-white disabled:opacity-60"
        >
          {pending ? labels.saving : labels.save}
        </button>
        {state.error && (
          <p role="alert" className="rounded-xl bg-red-500/15 px-4 py-2.5 text-sm text-red-200">
            {labels[state.error as keyof Labels] ?? labels.generic}
          </p>
        )}
        {state.ok && !pending && (
          <p role="status" className="text-sm text-emerald-300">
            ✓ {labels.saved}
          </p>
        )}
        {slug && (
          <Link
            href={`/${locale}/providers/${slug}`}
            className="text-sm font-semibold text-glow hover:text-white"
          >
            {labels.viewPublic} →
          </Link>
        )}
      </div>
    </form>
  );
}
