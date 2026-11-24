"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { drawCategoryCard } from "./category-card";
import { Gallery } from "./gallery";

export type SpiralCategory = {
  slug: string;
  name: string;
  icon: string;
  hue: number;
  count: number;
};

type Item = SpiralCategory & { img: string };

// Same condition as the .spiral-only / .spiral-hide rules in globals.css.
const SPIRAL_QUERY =
  "(min-width: 769px) and (hover: hover) and (prefers-reduced-motion: no-preference)";

// Pixels of page scroll per category while the spiral is on screen.
const SCROLL_PER_CARD = 110;

// A scroll-driven 3D spiral of every category (desktop only). The section is
// tall; its inner panel sticks to the top while page scroll turns the spiral.
export default function SpiralCategories({
  categories,
  locale,
  title,
  hint,
  toursLabel,
  exploreLabel,
  viewAllLabel,
}: {
  categories: SpiralCategory[];
  locale: string;
  title: string;
  hint: string;
  toursLabel: string;
  exploreLabel: string;
  viewAllLabel: string;
}) {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState<Item | null>(null);
  const [focused, setFocused] = useState<Item | null>(null);
  const hoveredRef = useRef<Item | null>(null);
  useEffect(() => {
    hoveredRef.current = hovered;
  });

  const detail = hovered ?? focused ?? categories[0];
  const href = (slug: string) => `/${locale}/categories/${slug}`;

  useEffect(() => {
    const section = sectionRef.current;
    const panel = panelRef.current;
    const canvas = canvasRef.current;
    if (!section || !panel || !canvas || !window.matchMedia(SPIRAL_QUERY).matches) return;

    let cancelled = false;
    let gallery: Gallery | undefined;
    let lastY = window.scrollY;
    let lastT = performance.now();

    const onScroll = () => {
      if (!gallery) return;
      const stickTop = parseFloat(getComputedStyle(panel).top) || 0;
      const travel = section.offsetHeight - panel.offsetHeight;
      const progress = (stickTop - section.getBoundingClientRect().top) / travel;
      gallery.setScroll(Math.min(1, Math.max(0, progress)));
      const now = performance.now();
      const dt = Math.max(16, now - lastT);
      gallery.setVelocity(((window.scrollY - lastY) / dt) * 1000);
      lastY = window.scrollY;
      lastT = now;
    };

    (async () => {
      // Cards are drawn with the site font, so wait for it.
      const font = getComputedStyle(document.body).fontFamily;
      await document.fonts.load(`700 52px ${font}`).catch(() => undefined);
      if (cancelled) return;
      const rtl = document.documentElement.dir === "rtl";
      const items: Item[] = categories.map((category) => ({
        ...category,
        img: drawCategoryCard({
          hue: category.hue,
          icon: category.icon,
          name: category.name,
          countText: `${category.count} ${toursLabel}`,
          rtl,
          font,
        }),
      }));
      gallery = new Gallery(canvas, items, {
        onHover: (item: Item | null) => setHovered(item),
        onFocus: (item: Item | null) => setFocused(item),
        config: { cardH: 1.35, cardAspect: 600 / 450, radius: 2.5, dY: 0.92, camZ: 8.5 },
      });
      onScroll();
    })();

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelled = true;
      window.removeEventListener("scroll", onScroll);
      gallery?.destroy();
    };
  }, [categories, toursLabel]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="spiral-title"
      className="spiral-only relative mt-16 bg-ink text-white"
      style={{ height: `calc(100vh - 4rem + ${categories.length * SCROLL_PER_CARD}px)` }}
    >
      <div
        ref={panelRef}
        className="sticky top-16 h-[calc(100vh-4rem)] overflow-hidden bg-[radial-gradient(ellipse_at_center,rgba(94,234,212,0.10),transparent_60%)]"
      >
        <canvas
          ref={canvasRef}
          aria-hidden
          onClick={() => {
            const item = hoveredRef.current;
            if (item) router.push(href(item.slug));
          }}
          className={`absolute inset-0 block h-full w-full ${hovered ? "cursor-pointer" : ""}`}
        />

        <div className="pointer-events-none relative mx-auto flex h-full max-w-6xl flex-col justify-between px-4 py-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="spiral-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
                {title}
              </h2>
              <p className="mt-2 text-sm text-white/55">{hint}</p>
            </div>
            <Link
              href={`/${locale}/categories`}
              className="pointer-events-auto shrink-0 text-sm font-semibold text-glow hover:text-white"
            >
              {viewAllLabel}
            </Link>
          </div>

          {detail && (
            <div className="max-w-xs" aria-live="polite">
              <span className="block text-4xl" aria-hidden>
                {detail.icon}
              </span>
              <p className="mt-3 text-2xl font-bold leading-tight">{detail.name}</p>
              <p className="mt-1 text-sm text-white/60">
                {detail.count} {toursLabel}
              </p>
              <Link
                href={href(detail.slug)}
                className="pointer-events-auto mt-4 inline-block rounded-full bg-glow px-5 py-2 text-sm font-semibold text-ink transition hover:bg-white"
              >
                {exploreLabel} <span className="inline-block rtl:rotate-180">→</span>
              </Link>
            </div>
          )}
        </div>

        {/* The canvas is not readable by screen readers or keyboards. */}
        <ul className="sr-only">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link href={href(category.slug)}>
                {category.name} ({category.count} {toursLabel})
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
