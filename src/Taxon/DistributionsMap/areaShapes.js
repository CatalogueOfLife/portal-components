import config from "../../config";

// Shapes of gazetteer areas from the API, in one of two variants for iso
// countries: the land only, or the land with the exclusive economic zone, as
// GBIF uses it. Exported from col-browser/map for the ChecklistBank UI too.

export const LAND = "land";
export const EEZ = "eez";

// Only countries have an EEZ variant: the API returns the same shape for iso
// subdivisions such as iso:US-CA and for other gazetteers.
export const hasEezVariant = (area) =>
  area?.gazetteer === "iso" && /^[A-Z]{2}$/i.test(area?.id || "");

// Areas without an EEZ variant keep a single URL, so both variants share them.
export const shapeUrl = (area, variant = LAND) =>
  `${config.dataApi}vocab/area/${area.gazetteer}:${encodeURIComponent(
    area.id
  )}.geojson${variant === EEZ && hasEezVariant(area) ? "?variant=eez" : ""}`;

export const isMarine = (environments) =>
  Array.isArray(environments) &&
  environments.some((e) => String(e).toLowerCase() === "marine");

// The EEZ shape includes the land, so it suits taxa that are also found on land
// or in fresh water.
export const defaultVariant = (environments) =>
  isMarine(environments) ? EEZ : LAND;

// Plain fetch without credentials: the shapes are public, and requests without
// an Authorization header stay on the cached read only server. Failures give
// null.
const cache = new Map();
export const fetchShape = (area, variant = LAND) => {
  const url = shapeUrl(area, variant);
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    );
  }
  return cache.get(url);
};
