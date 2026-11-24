"use client";

import { useActionState, useState } from "react";
import { deleteTour, saveTour, type FormState } from "@/lib/actions";
import { detectPlatform } from "@/lib/platforms";
import type { MemberTour } from "@/lib/session";
import { inputClass, keepValues } from "./AuthForm";
import LocationPicker from "./LocationPicker";

type Labels = Record<
  | "title"
  | "titleHint"
  | "url"
  | "urlHint"
  | "category"
  | "choose"
  | "platform"
  | "other"
  | "whereTitle"
  | "whereHint"
  | "city"
  | "country"
  | "save"
  | "saving"
  | "delete"
  | "deleteConfirm"
  | "needProfile"
  | "needTitle"
  | "badUrl"
  | "duplicateUrl"
  | "needCategory"
  | "needPlatform"
  | "needLocation"
  | "needPlace"
  | "notFound"
  | "generic",
  string
>;

const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="mb-1.5 block text-sm text-white/70">{label}</span>
    {children}
    {hint && <span className="mt-1.5 block text-xs text-white/45">{hint}</span>}
  </label>
);

export default function TourForm({
  locale,
  tour,
  categories,
  platforms,
  labels,
}: {
  locale: string;
  tour: MemberTour | null;
  categories: { slug: string; name: string; icon: string }[];
  platforms: string[];
  labels: Labels;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveTour, {});
  const [platform, setPlatform] = useState(tour?.platform ?? "");

  return (
    <>
      {/* method="post" keeps the values out of the address bar if someone
          submits before the page's scripts have loaded. */}
      <form method="post" onSubmit={keepValues(action)} className="grid gap-8 lg:grid-cols-2">
        <input type="hidden" name="locale" value={locale} />
        {tour && <input type="hidden" name="id" value={tour.id} />}

        <div className="space-y-5">
          <Field label={labels.title}>
            <input
              name="title"
              required
              maxLength={200}
              defaultValue={tour?.title}
              placeholder={labels.titleHint}
              className={inputClass}
            />
          </Field>

          <Field label={labels.url} hint={labels.urlHint}>
            <input
              name="tourUrl"
              type="url"
              required
              dir="ltr"
              maxLength={700}
              placeholder="https://"
              defaultValue={tour?.tourUrl}
              // Pick the platform from the link when it's a known one.
              onChange={(event) => {
                const detected = detectPlatform(event.target.value);
                if (detected) setPlatform(detected);
              }}
              className={inputClass}
            />
          </Field>

          <Field label={labels.category}>
            <select
              name="category"
              required
              defaultValue={tour?.category ?? ""}
              className={`${inputClass} [&>option]:bg-ink`}
            >
              <option value="" disabled>
                {labels.choose}
              </option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={labels.platform}>
            <select
              name="platform"
              required
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              className={`${inputClass} [&>option]:bg-ink`}
            >
              <option value="" disabled>
                {labels.choose}
              </option>
              {platforms.map((option) => (
                <option key={option} value={option}>
                  {option === "Other" ? labels.other : option}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold">{labels.whereTitle}</h3>
            <p className="mt-1 text-sm text-white/55">{labels.whereHint}</p>
          </div>
          <LocationPicker
            initial={tour?.lat != null && tour.lng != null ? { lat: tour.lat, lng: tour.lng } : null}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={labels.city}>
              <input
                name="city"
                required
                maxLength={120}
                defaultValue={tour?.city}
                className={inputClass}
              />
            </Field>
            <Field label={labels.country}>
              <input
                name="country"
                required
                maxLength={120}
                defaultValue={tour?.country}
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
        </div>
      </form>

      {tour && (
        <form
          action={deleteTour}
          onSubmit={(event) => {
            if (!window.confirm(labels.deleteConfirm)) event.preventDefault();
          }}
          className="mt-10 border-t border-white/10 pt-6"
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="id" value={tour.id} />
          <button
            type="submit"
            className="rounded-full border border-red-400/40 px-5 py-2 text-sm text-red-200 transition hover:border-red-300 hover:bg-red-500/15"
          >
            {labels.delete}
          </button>
        </form>
      )}
    </>
  );
}
