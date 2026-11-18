"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  Popup,
  setWorkerUrl,
  type GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// The bundler can't resolve MapLibre's worker on its own, so it is served from
// public/ (copied there by `npm run copy-map-worker`).
setWorkerUrl("/maplibre-gl-worker.mjs");

export type MapPoint = {
  slug: string;
  title: string;
  place: string;
  category: string;
  lng: number;
  lat: number;
};

type Props = {
  points: MapPoint[];
  locale: string;
  openLabel: string;
  categories?: { slug: string; name: string }[];
  allLabel?: string;
  resultsLabel?: string;
  center?: [number, number];
  zoom?: number;
  className?: string;
};

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const SOURCE = "tours";
const BRAND = "#0e7490";

const toGeoJSON = (points: MapPoint[]) => ({
  type: "FeatureCollection" as const,
  features: points.map((p) => ({
    type: "Feature" as const,
    geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
    properties: { slug: p.slug, title: p.title, place: p.place },
  })),
});

export default function MapView({
  points,
  locale,
  openLabel,
  categories,
  allLabel,
  resultsLabel,
  center = [20, 25],
  zoom = 1.4,
  className = "h-[70vh]",
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [category, setCategory] = useState("");

  const visible = useMemo(
    () => (category ? points.filter((p) => p.category === category) : points),
    [points, category],
  );
  // Lets the load handler read the current filter if it changed while tiles loaded.
  const visibleRef = useRef(visible);

  useEffect(() => {
    if (!container.current) return;
    const map = new MapLibreMap({
      container: container.current,
      style: STYLE_URL,
      center,
      zoom,
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    map.on("error", (event) => console.error("Map error:", event.error));

    map.on("load", () => {
      map.addSource(SOURCE, {
        type: "geojson",
        data: toGeoJSON(visibleRef.current),
        cluster: true,
        clusterRadius: 45,
        clusterMaxZoom: 12,
      });
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: SOURCE,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": BRAND,
          "circle-opacity": 0.85,
          "circle-radius": ["step", ["get", "point_count"], 16, 5, 22, 25, 30],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: SOURCE,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 13,
        },
        paint: { "text-color": "#ffffff" },
      });
      map.addLayer({
        id: "pins",
        type: "circle",
        source: SOURCE,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": BRAND,
          "circle-radius": 8,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });

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
        const feature = event.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;
        const { slug, title, place } = feature.properties as Record<string, string>;

        const body = document.createElement("div");
        body.dir = document.documentElement.dir;
        const heading = document.createElement("strong");
        heading.textContent = title;
        const where = document.createElement("div");
        where.textContent = place;
        where.style.cssText = "color:#5b6577;font-size:12px;margin:2px 0 8px";
        const link = document.createElement("a");
        link.href = `/${locale}/tours/${slug}`;
        link.textContent = openLabel;
        link.style.cssText = `color:${BRAND};font-weight:600`;
        body.append(heading, where, link);

        new Popup({ offset: 12 })
          .setLngLat(feature.geometry.coordinates as [number, number])
          .setDOMContent(body)
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
      map.remove();
      mapRef.current = null;
    };
    // The map is created once; later filter changes go through setData below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    visibleRef.current = visible;
    mapRef.current?.getSource<GeoJSONSource>(SOURCE)?.setData(toGeoJSON(visible));
  }, [visible]);

  return (
    <div>
      {categories && (
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <select
            aria-label={allLabel}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">{allLabel}</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <span className="text-sm text-muted">
            {visible.length} {resultsLabel}
          </span>
        </div>
      )}
      <div
        ref={container}
        dir="ltr"
        className={`w-full overflow-hidden rounded-xl border border-border ${className}`}
      />
    </div>
  );
}
