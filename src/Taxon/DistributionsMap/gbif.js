import { useEffect, useState } from "react";
import config from "../../config";

// GBIF indexes occurrences against the Catalogue of Life as this checklist,
// keyed by the taxon ids of the latest COL extended release.
export const GBIF_COL_CHECKLIST = "7ddf754f-d193-4cc9-b351-99906754a03b";

const FILTER =
  "hasCoordinate=true&hasGeospatialIssue=false&occurrenceStatus=PRESENT";

const taxonQuery = (checklistKey, taxonKey) =>
  `checklistKey=${encodeURIComponent(checklistKey)}&taxonKey=${encodeURIComponent(taxonKey)}`;

// GBIF v2 occurrence density tiles (multitaxonomy) as hexagons.
export const gbifTileUrl = (checklistKey, taxonKey) =>
  `${config.gbifApi}/v2/map/occurrence/density/{z}/{x}/{y}@1x.png?srs=EPSG%3A3857&style=iNaturalist.poly&bin=hex&hexPerTile=64&${FILTER}&${taxonQuery(checklistKey, taxonKey)}`;

// The occurrence search on the GBIF portal, with the same filters as the tiles.
export const gbifSearchUrl = (checklistKey, taxonKey) =>
  `${config.gbifPortal}/occurrence/search?checklist_key=${encodeURIComponent(
    checklistKey
  )}&taxon_key=${encodeURIComponent(
    taxonKey
  )}&has_coordinate=true&has_geospatial_issue=false&occurrence_status=present`;

// The number of GBIF occurrences with coordinates, or null when GBIF can't be
// reached. Plain fetch, so no credentials go to GBIF.
export const fetchGbifCount = async (checklistKey, taxonKey) => {
  try {
    const res = await fetch(
      `${config.gbifApi}/v1/occurrence/search?${taxonQuery(checklistKey, taxonKey)}&${FILTER}&limit=0`
    );
    if (!res.ok) return null;
    return (await res.json())?.count ?? 0;
  } catch {
    return null;
  }
};

// null while loading, without keys or when GBIF fails, otherwise the count.
export const useGbifCount = (checklistKey, taxonKey) => {
  const [count, setCount] = useState(null);
  useEffect(() => {
    setCount(null);
    if (!checklistKey || !taxonKey) return undefined;
    let cancelled = false;
    fetchGbifCount(checklistKey, taxonKey).then((c) => {
      if (!cancelled) setCount(c);
    });
    return () => {
      cancelled = true;
    };
  }, [checklistKey, taxonKey]);
  return count;
};

// Hexagon swatch of the occurrence layer, for the legends.
export const GbifLegendEntry = ({ style }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, ...style }}>
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <polygon
        points="3,1 9,1 11,6 9,11 3,11 1,6"
        fill="#de1e6e"
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="0.75"
      />
    </svg>
    <span>GBIF occurrences</span>
  </div>
);
