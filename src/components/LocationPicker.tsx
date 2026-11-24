"use client";

import { useEffect, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  setWorkerUrl,
  type GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { DARK_STYLE_URL, PIN, tintStyle } from "@/lib/map-style";

setWorkerUrl("/maplibre-gl-worker.js");

type Point = { lat: number; lng: number };

// The pin, plus a circle of the given radius (if any) so a service area shows.
function circle({ lat, lng }: Point, radiusKm: number) {
  const steps = 64;
  const coords: [number, number][] = [];
  const dLat = radiusKm / 110.574;
  const dLng = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    coords.push([lng + dLng * Math.cos(t), lat + dLat * Math.sin(t)]);
  }
  const area = {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "Polygon" as const, coordinates: [coords] },
  };
  return {
    type: "FeatureCollection" as const,
    features: [
      ...(radiusKm > 0 ? [area] : []),
      {
        type: "Feature" as const,
        properties: {},
        geometry: { type: "Point" as const, coordinates: [lng, lat] },
      },
    ],
  };
}

const EMPTY = { type: "FeatureCollection" as const, features: [] };

// Click the map to place a pin. With a radius, the area around it is drawn too.
export default function LocationPicker({
  initial,
  radiusKm = 0,
}: {
  initial: Point | null;
  radiusKm?: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [point, setPoint] = useState<Point | null>(initial);
  // Lets the map's load handler see the latest values.
  const state = useRef({ point, radiusKm });
  useEffect(() => {
    state.current = { point, radiusKm };
  });

  useEffect(() => {
    if (!container.current) return;
    const start = state.current.point;
    const map = new MapLibreMap({
      container: container.current,
      style: DARK_STYLE_URL,
      center: start ? [start.lng, start.lat] : [20, 25],
      zoom: start ? 6 : 1.2,
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.on("style.load", () => tintStyle(map, { labels: "all" }));
    map.getCanvas().style.cursor = "crosshair";

    map.on("load", () => {
      const { point: p, radiusKm: r } = state.current;
      map.addSource("area", { type: "geojson", data: p ? circle(p, r) : EMPTY });
      map.addLayer({
        id: "area-fill",
        type: "fill",
        source: "area",
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: { "fill-color": PIN, "fill-opacity": 0.14 },
      });
      map.addLayer({
        id: "area-line",
        type: "line",
        source: "area",
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: { "line-color": PIN, "line-width": 1.5, "line-opacity": 0.7 },
      });
      map.addLayer({
        id: "area-pin",
        type: "circle",
        source: "area",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-color": PIN,
          "circle-radius": 7,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#06131b",
        },
      });
    });

    map.on("click", (event) => {
      setPoint({
        lat: Math.round(event.lngLat.lat * 1e6) / 1e6,
        lng: Math.round(event.lngLat.lng * 1e6) / 1e6,
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Redraw the area when the point or radius changes.
  useEffect(() => {
    const source = mapRef.current?.getSource<GeoJSONSource>("area");
    source?.setData(point ? circle(point, radiusKm) : EMPTY);
  }, [point, radiusKm]);

  return (
    <div>
      <div
        ref={container}
        className="atlas-map h-72 w-full overflow-hidden rounded-2xl border border-white/10 bg-ink sm:h-80"
      />
      <input type="hidden" name="lat" value={point?.lat ?? ""} />
      <input type="hidden" name="lng" value={point?.lng ?? ""} />
      {point && (
        <p className="mt-2 font-mono text-xs text-white/45" dir="ltr">
          {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
        </p>
      )}
    </div>
  );
}
