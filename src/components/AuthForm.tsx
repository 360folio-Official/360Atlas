"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { signIn, signUp, type FormState } from "@/lib/actions";

type Labels = {
  name: string;
  email: string;
  password: string;
  passwordHint: string;
  submit: string;
  pending: string;
  switchText: string;
  switchLink: string;
  errors: Record<string, string>;
};

// Submits through the action without React's automatic form reset, so a
// failed submit keeps what the person typed.
export const keepValues =
  (action: (data: FormData) => void) => (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => action(data));
  };

export const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-glow focus:bg-white/10";

export default function AuthForm({
  mode,
  locale,
  switchHref,
  labels,
}: {
  mode: "sign-in" | "sign-up";
  locale: string;
  switchHref: string;
  labels: Labels;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    mode === "sign-up" ? signUp : signIn,
    {},
  );

  return (
    // method="post": if someone submits before the scripts load, the browser
    // must not put the password in the address bar.
    <form
      method="post"
      onSubmit={keepValues(action)}
      className="w-full max-w-md rounded-3xl border border-white/10 bg-ink/70 p-6 shadow-[0_30px_80px_-30px] shadow-black backdrop-blur-md sm:p-8"
    >
      <input type="hidden" name="locale" value={locale} />
      <div className="space-y-4">
        {mode === "sign-up" && (
          <label className="block">
            <span className="mb-1.5 block text-sm text-white/70">{labels.name}</span>
            <input name="name" required autoComplete="name" className={inputClass} />
          </label>
        )}
        <label className="block">
          <span className="mb-1.5 block text-sm text-white/70">{labels.email}</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm text-white/70">{labels.password}</span>
          <input
            name="password"
            type="password"
            required
            minLength={mode === "sign-up" ? 10 : undefined}
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            className={inputClass}
          />
          {mode === "sign-up" && (
            <span className="mt-1 block text-xs text-white/40">{labels.passwordHint}</span>
          )}
        </label>
      </div>

      {state.error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-500/15 px-4 py-2.5 text-sm text-red-200">
          {labels.errors[state.error] ?? labels.errors.generic}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-full bg-glow px-6 py-3 font-semibold text-ink transition hover:bg-white disabled:opacity-60"
      >
        {pending ? labels.pending : labels.submit}
      </button>

      <p className="mt-5 text-center text-sm text-white/55">
        {labels.switchText}{" "}
        <Link href={switchHref} className="font-semibold text-glow hover:text-white">
          {labels.switchLink}
        </Link>
      </p>
    </form>
  );
}
