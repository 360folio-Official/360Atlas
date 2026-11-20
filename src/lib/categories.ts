// Categories are a fixed list that matches the translation files, so they
// live in code (and are mirrored in the categories table for foreign keys).
import { categories } from "@/data/seed";

export const getCategories = () => categories;
export const getCategory = (slug: string) =>
  categories.find((c) => c.slug === slug);
