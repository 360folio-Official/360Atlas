import type { Map as MapLibreMap } from "maplibre-gl";

// The site's map look: OpenFreeMap's dark style recoloured to deep teal, shown as a globe.
export const DARK_STYLE_URL = "https://tiles.openfreemap.org/styles/dark";
export const PIN = "#5eead4";
export const LAND = "#0f2f3d";
export const WATER = "#06131b";

// MapLibre does not export its expression type, so expressions built at runtime are cast.
export const expr = (e: unknown) => e as never;

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

type TintOptions = {
  // "countries" hides every label except country names (for a whole-globe view).
  labels: "countries" | "all";
};

export function tintStyle(map: MapLibreMap, { labels }: TintOptions) {
  const set = (layer: string, prop: string, value: unknown) => {
    if (map.getLayer(layer)) map.setPaintProperty(layer, prop as never, expr(value));
  };
  set("background", "background-color", LAND);
  set("water", "fill-color", WATER);
  set("landcover_wood", "fill-color", "#123847");
  set("landuse_park", "fill-color", "#123847");
  for (const layer of ["boundary_country_z0-4", "boundary_country_z5-"]) {
    set(layer, "line-color", "rgba(94, 234, 212, 0.28)");
  }
  for (const layer of map.getStyle().layers) {
    if (layer.type !== "symbol") continue;
    if (labels === "countries" && !layer.id.startsWith("place_country")) {
      map.setLayoutProperty(layer.id, "visibility", "none");
      continue;
    }
    set(layer.id, "text-color", "rgba(204, 251, 241, 0.55)");
    set(layer.id, "text-halo-color", "rgba(6, 19, 27, 0.9)");
  }
}

export function makeGlobe(map: MapLibreMap) {
  map.setProjection({ type: "globe" });
  map.setSky({
    "sky-color": "#0b3a4f",
    "horizon-color": "#2dd4bf",
    "fog-color": "#06131b",
    "sky-horizon-blend": 0.6,
    "horizon-fog-blend": 0.5,
    "atmosphere-blend": expr(["interpolate", ["linear"], ["zoom"], 0, 1, 4, 0.6, 6, 0]),
  });
}

// Zoom at which the globe's diameter is about `diameter` pixels (diameter ≈ 512 · 2^z / π).
export const zoomForDiameter = (diameter: number) =>
  Math.max(0.2, Math.log2((diameter * Math.PI) / 512));
