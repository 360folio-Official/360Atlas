import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
import DarkPage from "@/components/DarkPage";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getDictionary();
  return { title: dict.auth.signUpTitle, robots: { index: false } };
}

export default async function SignUpPage() {
  const { locale, dict } = await getDictionary();
  const a = dict.auth;

  return (
    <DarkPage title={a.signUpTitle} intro={a.signUpIntro}>
      <AuthForm
        mode="sign-up"
        locale={locale}
        switchHref={`/${locale}/sign-in`}
        labels={{
          name: a.name,
          email: a.email,
          password: a.password,
          passwordHint: a.passwordHint,
          submit: a.signUpButton,
          pending: a.pending,
          switchText: a.haveAccount,
          switchLink: a.signInLink,
          errors: a.errors,
        }}
      />
    </DarkPage>
  );
}
