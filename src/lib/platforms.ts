import type { Platform } from "@/data/seed";

// Tour platforms members can pick from.
export const platformOptions: Platform[] = [
  "Matterport",
  "Kuula",
  "3DVista",
  "CloudPano",
  "Panoee",
  "Google Street View",
];

// A tour can also live on a platform we don't list.
export const tourPlatformOptions: Platform[] = [...platformOptions, "Other"];

// Guesses the platform from a tour link, so the form can pick it for you.
const hosts: [RegExp, Platform][] = [
  [/(^|\.)matterport\.com$/, "Matterport"],
  [/(^|\.)kuula\.co$/, "Kuula"],
  [/(^|\.)3dvista\.com$/, "3DVista"],
  [/(^|\.)cloudpano\.com$/, "CloudPano"],
  [/(^|\.)panoee\.(com|net)$/, "Panoee"],
  [/(^|\.)(google\.[a-z.]+|goo\.gl)$/, "Google Street View"],
];

export function detectPlatform(url: string): Platform | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return hosts.find(([pattern]) => pattern.test(host))?.[1] ?? null;
  } catch {
    return null;
  }
}
