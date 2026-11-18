import { lang } from "next/root-params";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./config";

const dictionaries = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  ar: () => import("./dictionaries/ar.json").then((m) => m.default),
  es: () => import("./dictionaries/es.json").then((m) => m.default),
  fr: () => import("./dictionaries/fr.json").then((m) => m.default),
};

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["en"]>>;

export const getLocale = async (): Promise<Locale> => {
  const locale = await lang();
  if (!locale || !isLocale(locale)) notFound();
  return locale;
};

export const getDictionary = async (): Promise<{
  locale: Locale;
  dict: Dictionary;
}> => {
  const locale = await getLocale();
  return { locale, dict: await dictionaries[locale]() };
};
