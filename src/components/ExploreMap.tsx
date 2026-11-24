"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  Popup,
  setWorkerUrl,
  type GeoJSONSource,
  type MapGeoJSONFeature,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { GlobePoint } from "@/lib/map-points";
import {
  DARK_STYLE_URL,
  PIN,
  easeOutCubic,
  makeGlobe,
  tintStyle,
  zoomForDiameter,
} from "@/lib/map-style";

setWorkerUrl("/maplibre-gl-worker.js");

type Props = {
  points: GlobePoint[];
  locale: string;
  title: string;
  intro: string;
  openLabel: string;
  allLabel: string;
  resultsLabel: string;
  categories: { slug: string; name: string; icon: string }[];
};

const SOURCE = "tours";
const SPIN_IN = 2800;

const toGeoJSON = (points: GlobePoint[]) => ({
  type: "FeatureCollection" as const,
  features: points.map((p) => ({
    type: "Feature" as const,
    id: p.id,
    geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
    properties: { id: p.id },
  })),
});

function popupCard(point: GlobePoint, href: string, openLabel: string) {
  const card = document.createElement("a");
  card.href = href;
  card.className = "atlas-popup-card";
  card.dir = document.documentElement.dir;

  const swatch = document.createElement("span");
  swatch.className = "atlas-popup-swatch";
  swatch.style.background = `linear-gradient(135deg, hsl(${point.hue} 55% 42%), hsl(${(point.hue + 40) % 360} 60% 22%))`;
  swatch.textContent = point.icon;

  const body = document.createElement("span");
  const kind = document.createElement("span");
  kind.className = "atlas-popup-kind";
  kind.textContent = point.categoryName;
  const title = document.createElement("strong");
  title.textContent = point.title;
  const place = document.createElement("span");
  place.className = "atlas-popup-place";
  place.textContent = point.place;
  const open = document.createElement("span");
  open.className = "atlas-popup-open";
  open.textContent = `${openLabel} →`;
  body.append(kind, title, place, open);

  card.append(swatch, body);
  return card;
}

export default function ExploreMap({
  points,
  locale,
  title,
  intro,
  openLabel,
  allLabel,
  resultsLabel,
  categories,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [ready, setReady] = useState(false);
  const [category, setCategory] = useState("");

  const visible = useMemo(
    () => (category ? points.filter((p) => p.category === category) : points),
    [points, category],
  );
  const visibleRef = useRef(visible);

  useEffect(() => {
    if (!container.current) return;
    const el = container.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const byId = new Map(points.map((p) => [p.id, p]));

    const rtl = document.documentElement.dir === "rtl";
    // The filter panel takes a column on wide screens and a band on top on phones,
    // so the globe centres in the space that is left.
    const wide = () => el.offsetWidth >= 1024;
    const panel = () => (wide() ? 460 : 200);
    const padding = () =>
      !wide()
        ? { top: panel(), bottom: 0, left: 0, right: 0 }
        : rtl
          ? { top: 0, bottom: 0, left: 0, right: panel() }
          : { top: 0, bottom: 0, left: panel(), right: 0 };
    const restZoom = () =>
      zoomForDiameter(
        wide()
          ? Math.min((el.offsetWidth - panel()) * 0.9, el.offsetHeight * 0.88)
          : Math.min(el.offsetWidth * 0.95, (el.offsetHeight - panel()) * 0.9),
      );
    const restCenter: [number, number] = [20, 22];

    const map = new MapLibreMap({
      container: el,
      style: DARK_STYLE_URL,
      center: reduceMotion ? restCenter : [restCenter[0] - 120, 10],
      zoom: reduceMotion ? restZoom() : restZoom() - 1.4,
      attributionControl: { compact: true },
      maxZoom: 17,
    });
    mapRef.current = map;
    map.setPadding(padding());
    const onResize = () => map.setPadding(padding());
    window.addEventListener("resize", onResize);
    map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");

    map.on("style.load", () => {
      makeGlobe(map);
      tintStyle(map, { labels: "all" });
    });

    map.on("load", () => {
      map.addSource(SOURCE, {
        type: "geojson",
        data: toGeoJSON(visibleRef.current),
        cluster: true,
        clusterRadius: 45,
        clusterMaxZoom: 12,
      });

      // Everything starts transparent and fades in as the globe settles.
      const fade = { duration: 1200, delay: reduceMotion ? 0 : 900 };
      map.addLayer({
        id: "cluster-glow",
        type: "circle",
        source: SOURCE,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": PIN,
          "circle-blur": 1,
          "circle-radius": ["step", ["get", "point_count"], 30, 5, 38, 25, 48],
          "circle-opacity": 0,
          "circle-opacity-transition": fade,
        },
      });
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: SOURCE,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#0b3a4f",
          "circle-radius": ["step", ["get", "point_count"], 16, 5, 21, 25, 28],
          "circle-stroke-width": 2,
          "circle-stroke-color": PIN,
          "circle-opacity": 0,
          "circle-stroke-opacity": 0,
          "circle-opacity-transition": fade,
          "circle-stroke-opacity-transition": fade,
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: SOURCE,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Noto Sans Bold"],
          "text-size": 13,
        },
        paint: {
          "text-color": "#ffffff",
          "text-opacity": 0,
          "text-opacity-transition": fade,
        },
      });
      map.addLayer({
        id: "pin-glow",
        type: "circle",
        source: SOURCE,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": PIN,
          "circle-blur": 1,
          "circle-radius": 16,
          "circle-opacity": 0,
          "circle-opacity-transition": fade,
        },
      });
      map.addLayer({
        id: "pins",
        type: "circle",
        source: SOURCE,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": PIN,
          "circle-radius": 6,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#06131b",
          "circle-opacity": 0,
          "circle-stroke-opacity": 0,
          "circle-opacity-transition": fade,
          "circle-stroke-opacity-transition": fade,
        },
      });

      for (const [layer, prop, value] of [
        ["cluster-glow", "circle-opacity", 0.35],
        ["clusters", "circle-opacity", 0.95],
        ["clusters", "circle-stroke-opacity", 1],
        ["cluster-count", "text-opacity", 1],
        ["pin-glow", "circle-opacity", 0.45],
        ["pins", "circle-opacity", 1],
        ["pins", "circle-stroke-opacity", 1],
      ] as const) {
        map.setPaintProperty(layer, prop, value);
      }

      setReady(true);
      if (!reduceMotion) {
        map.easeTo({
          center: restCenter,
          zoom: restZoom(),
          duration: SPIN_IN,
          easing: easeOutCubic,
        });
      }

      map.on("click", "clusters", async (event) => {
        const feature = event.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;
        const source = map.getSource<GeoJSONSource>(SOURCE);
        const nextZoom = await source?.getClusterExpansionZoom(
          feature.properties.cluster_id,
        );
        map.easeTo({
          center: feature.geometry.coordinates as [number, number],
          zoom: nextZoom ?? map.getZoom() + 2,
        });
      });

      map.on("click", "pins", (event) => {
        const feature = event.features?.[0] as MapGeoJSONFeature | undefined;
        if (!feature || feature.geometry.type !== "Point") return;
        const point = byId.get(feature.properties.id as number);
        if (!point) return;
        new Popup({ offset: 14, className: "atlas-popup", maxWidth: "320px" })
          .setLngLat(feature.geometry.coordinates as [number, number])
          .setDOMContent(popupCard(point, `/${locale}/tours/${point.slug}`, openLabel))
          .addTo(map);
      });

      for (const layer of ["clusters", "pins"]) {
        map.on("mouseenter", layer, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layer, () => {
          map.getCanvas().style.cursor = "";
        });
      }
    });

    return () => {
      window.removeEventListener("resize", onResize);
      map.remove();
      mapRef.current = null;
    };
  }, [points, locale, openLabel]);

  useEffect(() => {
    visibleRef.current = visible;
    mapRef.current?.getSource<GeoJSONSource>(SOURCE)?.setData(toGeoJSON(visible));
  }, [visible]);

  const chip = (selected: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
      selected
        ? "border-glow bg-glow font-semibold text-ink"
        : "border-white/15 bg-white/5 text-white/80 hover:border-white/40 hover:text-white"
    }`;

  return (
    <section className="full-bleed hero-space relative isolate h-[calc(100svh-4rem)] min-h-[560px] overflow-hidden text-white">
      <div
        dir="ltr"
        className={`hero-globe absolute inset-0 ${ready ? "is-ready" : ""}`}
      >
        <div ref={container} className="h-full w-full" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 p-4 sm:p-6">
        <div className="rise pointer-events-auto max-w-md rounded-2xl border border-white/10 bg-ink/70 p-5 shadow-2xl shadow-black/40 backdrop-blur-md">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-white/65">{intro}</p>

          <select
            aria-label={allLabel}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-4 w-full rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white sm:hidden [&>option]:text-foreground"
          >
            <option value="">{allLabel}</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="mt-4 hidden flex-wrap gap-2 sm:flex">
            <button
              type="button"
              onClick={() => setCategory("")}
              className={chip(category === "")}
            >
              {allLabel}
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setCategory(c.slug)}
                className={chip(category === c.slug)}
              >
                <span aria-hidden>{c.icon}</span>
                {c.name}
              </button>
            ))}
          </div>

          <p className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">
            <span className="live-dot" aria-hidden />
            {visible.length} {resultsLabel}
          </p>
        </div>
      </div>
    </section>
  );
}
