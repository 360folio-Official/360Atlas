"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Map as MapLibreMap,
  setWorkerUrl,
  type MapGeoJSONFeature,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  DARK_STYLE_URL,
  PIN,
  easeOutCubic,
  expr,
  makeGlobe,
  tintStyle,
  zoomForDiameter,
} from "@/lib/map-style";
import type { GlobePoint } from "@/lib/map-points";

setWorkerUrl("/maplibre-gl-worker.mjs");

export type HeroPoint = GlobePoint;

type Props = {
  points: HeroPoint[];
  locale: string;
  nowShowingLabel: string;
  viewTourLabel: string;
};

const SOURCE = "hero-tours";

// Intro timings (ms).
const SPIN_IN = 3400;
const PINS_START = 1400;
const PINS_DURATION = 1800;
const STOP_EVERY = 6500;

const toGeoJSON = (points: HeroPoint[]) => ({
  type: "FeatureCollection" as const,
  features: points.map((p, i) => ({
    type: "Feature" as const,
    id: p.id,
    geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
    // `order` staggers the pin reveal: pins light up from west to east.
    properties: {
      index: i,
      order: (p.lng + 180) / 360,
      featured: p.featured,
    },
  })),
});

export default function HeroGlobe({
  points,
  locale,
  nowShowingLabel,
  viewTourLabel,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState<HeroPoint | null>(null);

  useEffect(() => {
    if (!container.current) return;
    const el = container.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const rtl = document.documentElement.dir === "rtl";

    // Keep the globe clear of the headline: beside it on wide screens, below it on phones.
    const padding = () => {
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      if (width >= 1024) {
        const side = Math.round(width * 0.42);
        return rtl
          ? { top: 0, bottom: 0, left: 0, right: side }
          : { top: 0, bottom: 0, left: side, right: 0 };
      }
      return { top: Math.round(height * 0.38), bottom: 0, left: 0, right: 0 };
    };
    const restZoom = () => {
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      const diameter =
        width >= 1024
          ? Math.min(width * 0.48, height * 0.8)
          : Math.min(width * 0.95, height * 0.62);
      return zoomForDiameter(diameter);
    };

    const stops = points.filter((p) => p.featured);
    const startLng = (stops[0]?.lng ?? 20) - 140;

    const map = new MapLibreMap({
      container: el,
      style: DARK_STYLE_URL,
      center: reduceMotion ? [stops[0]?.lng ?? 20, 20] : [startLng, 10],
      zoom: reduceMotion ? restZoom() : restZoom() - 1.6,
      attributionControl: { compact: true },
      scrollZoom: false,
      dragPan: !coarse,
      touchZoomRotate: false,
      doubleClickZoom: false,
      keyboard: false,
      maxZoom: 6,
    });
    map.setPadding(padding());

    let cancelled = false;
    let userTookOver = false;
    let frame = 0;
    let tourTimer: ReturnType<typeof setTimeout> | undefined;
    let activeId: number | null = null;

    const highlight = (point: HeroPoint | null) => {
      if (activeId !== null) {
        map.setFeatureState({ source: SOURCE, id: activeId }, { active: false });
      }
      activeId = point?.id ?? null;
      if (point) map.setFeatureState({ source: SOURCE, id: point.id }, { active: true });
      setActive(point);
    };

    const visit = (index: number) => {
      if (cancelled || userTookOver || stops.length === 0) return;
      const point = stops[index % stops.length];
      highlight(point);
      map.easeTo({
        center: [point.lng, point.lat * 0.6],
        duration: reduceMotion ? 0 : 3200,
        easing: (t) => t * t * (3 - 2 * t),
      });
      tourTimer = setTimeout(() => visit(index + 1), STOP_EVERY);
    };

    const stopTour = () => {
      userTookOver = true;
      clearTimeout(tourTimer);
    };

    map.on("style.load", () => {
      makeGlobe(map);
      tintStyle(map, { labels: "countries" });
    });

    map.on("load", () => {
      map.addSource(SOURCE, { type: "geojson", data: toGeoJSON(points) });

      const lit = (reveal: number) => expr(["step", ["get", "order"], 1, reveal, 0]);
      map.addLayer({
        id: "hero-pulse",
        type: "circle",
        source: SOURCE,
        paint: {
          "circle-color": PIN,
          "circle-radius": 6,
          "circle-opacity": 0,
          "circle-blur": 0.4,
        },
      });
      map.addLayer({
        id: "hero-pins",
        type: "circle",
        source: SOURCE,
        paint: {
          "circle-color": expr([
            "case",
            ["boolean", ["feature-state", "active"], false],
            "#ffffff",
            PIN,
          ]),
          "circle-radius": expr([
            "case",
            ["boolean", ["feature-state", "active"], false],
            8,
            5.5,
          ]),
          "circle-stroke-width": 2,
          "circle-stroke-color": "rgba(6, 19, 27, 0.85)",
          "circle-opacity": reduceMotion ? 1 : lit(0),
          "circle-stroke-opacity": reduceMotion ? 1 : lit(0),
        },
      });

      const started = performance.now();
      const animate = (now: number) => {
        if (cancelled) return;
        const elapsed = now - started;

        if (!reduceMotion) {
          const reveal = Math.min(1.01, Math.max(0, (elapsed - PINS_START) / PINS_DURATION) * 1.01);
          if (reveal < 1.01 || elapsed < PINS_START + PINS_DURATION + 100) {
            map.setPaintProperty("hero-pins", "circle-opacity", lit(reveal));
            map.setPaintProperty("hero-pins", "circle-stroke-opacity", lit(reveal));
          }
        }

        // A soft ring ripples out from every pin; the active one ripples harder.
        const phase = ((elapsed % 2400) / 2400);
        const active = expr(["boolean", ["feature-state", "active"], false]);
        map.setPaintProperty("hero-pulse", "circle-radius", expr([
          "case", active, 8 + phase * 26, 5 + phase * 12,
        ]));
        map.setPaintProperty("hero-pulse", "circle-opacity", expr([
          "*",
          ["case", active, 0.55, 0.3],
          1 - easeOutCubic(phase),
          reduceMotion ? 1 : lit(Math.max(0, (elapsed - PINS_START) / PINS_DURATION)),
        ]));

        frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);

      setReady(true);

      if (reduceMotion) {
        visit(0);
        return;
      }
      map.easeTo({
        center: [(stops[0]?.lng ?? 20) - 25, 18],
        zoom: restZoom(),
        duration: SPIN_IN,
        easing: easeOutCubic,
      });
      tourTimer = setTimeout(() => visit(0), SPIN_IN + 200);
    });

    map.on("click", "hero-pins", (event) => {
      const feature = event.features?.[0] as MapGeoJSONFeature | undefined;
      if (!feature) return;
      stopTour();
      const point = points[feature.properties.index as number];
      if (point) {
        highlight(point);
        map.easeTo({ center: [point.lng, point.lat * 0.6], duration: 900 });
      }
    });
    map.on("mouseenter", "hero-pins", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "hero-pins", () => {
      map.getCanvas().style.cursor = "";
    });
    map.on("dragstart", stopTour);

    const onResize = () => map.setPadding(padding());
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      clearTimeout(tourTimer);
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      map.remove();
    };
  }, [points]);

  return (
    <>
      <div
        aria-hidden
        dir="ltr"
        className={`hero-globe absolute inset-0 ${ready ? "is-ready" : ""}`}
      >
        <div ref={container} className="h-full w-full" />
      </div>
      {active && (
        <Link
          key={active.slug}
          href={`/${locale}/tours/${active.slug}`}
          className="now-card absolute bottom-6 end-4 z-10 flex w-[min(22rem,calc(100%-2rem))] items-center gap-4 rounded-2xl border border-white/10 bg-ink/70 p-3 pe-5 text-white shadow-2xl shadow-black/40 backdrop-blur-md transition hover:border-teal-300/50 sm:end-8 sm:bottom-10"
        >
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-3xl"
            style={{
              background: `linear-gradient(135deg, hsl(${active.hue} 55% 42%), hsl(${(active.hue + 40) % 360} 60% 22%))`,
            }}
            aria-hidden
          >
            {active.icon}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-300">
              <span className="live-dot" aria-hidden />
              {nowShowingLabel}
            </span>
            <span className="mt-1 block truncate font-semibold">{active.title}</span>
            <span className="block truncate text-sm text-white/60">
              {active.place} · {active.categoryName}
            </span>
            <span className="mt-1 block text-sm font-semibold text-teal-300">
              {viewTourLabel} <span className="inline-block rtl:rotate-180">→</span>
            </span>
          </span>
        </Link>
      )}
    </>
  );
}
