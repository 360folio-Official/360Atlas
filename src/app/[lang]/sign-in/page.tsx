import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
import DarkPage from "@/components/DarkPage";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.auth.signInTitle, robots: { index: false } };
}

export default async function SignInPage() {
  const { locale, dict } = await getDictionary();
  const a = dict.auth;

  return (
    <DarkPage title={a.signInTitle} intro={a.signInIntro}>
      <AuthForm
        mode="sign-in"
        locale={locale}
        switchHref={`/${locale}/sign-up`}
        labels={{
          name: a.name,
          email: a.email,
          password: a.password,
          passwordHint: a.passwordHint,
          submit: a.signInButton,
          pending: a.pending,
          switchText: a.noAccount,
          switchLink: a.createOne,
          errors: a.errors,
        }}
      />
    </DarkPage>
  );
}
