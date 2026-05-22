import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet.control.layers.tree";
import "leaflet.control.layers.tree/L.Control.Layers.Tree.css";
import "./treeControl.css";
import axios from "axios";
import config from "../../config";
import { fetchDescendants } from "./descendantFetch";
import { getDescendantRanks, INFRASPECIFIC_RANKS } from "./descendantRanks";
import { assignColors } from "./colorAssignment";
import { buildTree } from "./descendantTree";
import IncludedTaxaLegend from "./IncludedTaxaLegend";

const POPUP_FIELDS = [
  "establishmentMeans",
  "degreeOfEstablishment",
  "pathway",
  "threatStatus",
  "year",
  "lifeStage",
];

export const ESTABLISHMENT_MEANS = [
  { key: "nativeendemic", label: "Native endemic", color: "#0F8554" },
  { key: "native", label: "Native", color: "#87C55F" },
  { key: "nativereintroduced", label: "Native reintroduced", color: "#C9DB74" },
  { key: "introduced", label: "Introduced", color: "#FE88B1" },
  {
    key: "introducedassistedcolonisation",
    label: "Introduced assisted colonisation",
    color: "#DCB0F2",
  },
  { key: "vagrant", label: "Vagrant", color: "#F6CF71" },
  { key: "uncertain", label: "Uncertain", color: "#8BE0A4" },
];

const ESTABLISHMENT_COLORS = Object.fromEntries(
  ESTABLISHMENT_MEANS.map((m) => [m.key, m.color])
);
export const MISSING_COLOR = "#66C5CC";

const normalizeKey = (v) =>
  String(v || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

const resolveKey = (record) => {
  const raw = record?.establishmentMeans;
  if (raw == null || raw === "") return null;
  const k = normalizeKey(raw);
  return ESTABLISHMENT_COLORS[k] ? k : "uncertain";
};

const colorFor = (record) => {
  const k = resolveKey(record);
  return k == null ? MISSING_COLOR : ESTABLISHMENT_COLORS[k];
};

const polygonStyleFor = (color) => ({
  color,
  weight: 1,
  fillColor: color,
  fillOpacity: 0.75,
});
const polygonHoverStyle = {
  weight: 2,
  fillOpacity: 0.95,
};

export const BASEMAPS = [
  {
    key: "carto",
    label: "Carto",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
    options: {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
      subdomains: "abcd",
    },
  },
  {
    key: "esri",
    label: "Esri",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}",
    options: {
      attribution:
        "Tiles &copy; Esri &mdash; Source: US National Park Service",
      maxZoom: 8,
    },
  },
];

export const DEFAULT_BASEMAP = "carto";

// GBIF v2 occurrence-density tile endpoint (multitaxonomy). The checklistKey
// is provided by the consumer; taxonKey is the focal taxon's identifier from
// that checklist (i.e. a COL identifier when consuming the COL backbone).
const GBIF_TILE_URL =
  "https://api.gbif.org/v2/map/occurrence/density/{z}/{x}/{y}@1x.png" +
  "?srs=EPSG%3A3857&style=iNaturalist.poly&bin=hex&hexPerTile=73" +
  "&checklistKey={checklistKey}&taxonKey={taxonKey}";

// Custom pane name and z-index for the GBIF overlay. Above Leaflet's data
// panes (tilePane 200, overlayPane 400, shadowPane 500) so occurrence tiles
// always paint above every other data layer regardless of paint order. Still
// below markerPane (600), tooltipPane (650) and popupPane (700) so markers
// and popups remain on top for interactivity.
const GBIF_PANE = "gbifPane";
const GBIF_PANE_Z = 550;

// Duplicate every feature at ±360° longitude offsets so the polygon layers
// repeat across world copies, matching the wrapping basemap. Leaflet's SVG
// renderer projects each coordinate once, so without this step polygons would
// only paint in the original world copy even though the basemap tiles repeat.
const shiftCoords = (coords, offset) => {
  if (typeof coords[0] === "number") return [coords[0] + offset, coords[1]];
  return coords.map((c) => shiftCoords(c, offset));
};

const WORLD_OFFSETS = [-360, 0, 360];

const wrapGeoJson = (geojson) => {
  if (!geojson) return geojson;
  const features =
    geojson.type === "FeatureCollection" ? geojson.features : [geojson];
  const out = [];
  features.forEach((f) => {
    WORLD_OFFSETS.forEach((offset) => {
      const tagged = {
        ...f,
        properties: { ...(f.properties || {}), _worldCopy: offset },
      };
      if (offset === 0) {
        out.push(tagged);
      } else {
        out.push({
          ...tagged,
          geometry: {
            ...f.geometry,
            coordinates: shiftCoords(f.geometry.coordinates, offset),
          },
        });
      }
    });
  });
  return { type: "FeatureCollection", features: out };
};

// Bounds of just the original (non-shifted) sublayers, so fitBounds doesn't
// zoom out to span all three world copies.
const originalCopyBounds = (geoJsonLayer) => {
  let bounds = null;
  geoJsonLayer.eachLayer((sub) => {
    if (sub.feature?.properties?._worldCopy !== 0) return;
    const b = sub.getBounds?.();
    if (!b || !b.isValid()) return;
    bounds = bounds ? bounds.extend(b) : L.latLngBounds(b.getSouthWest(), b.getNorthEast());
  });
  return bounds;
};

const cache = new Map();

const fetchShape = (gazetteer, id) => {
  const key = `${gazetteer}:${id}`;
  if (cache.has(key)) return cache.get(key);
  const url = `${config.dataApi}vocab/area/${key}`;
  const p = axios(url, {
    headers: { Accept: "application/geo+json" },
  }).then(
    (r) => wrapGeoJson(r.data),
    () => null
  );
  cache.set(key, p);
  return p;
};

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const popupHtml = (record) => {
  const title = record?.area?.name || record?.area?.globalId || "";
  const rows = POPUP_FIELDS.map((f) => [f, record?.[f]])
    .filter(([, v]) => v != null && v !== "")
    .map(
      ([k, v]) =>
        `<div><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</div>`
    )
    .join("");
  return `<div style="min-width:180px"><div style="font-weight:600;margin-bottom:4px">${escapeHtml(
    title
  )}</div>${rows}</div>`;
};

const RANK_LABEL_PLURAL = {
  subspecies: "subspecies",
  variety: "varieties",
  subvariety: "subvarieties",
  form: "forms",
  subform: "subforms",
  "infraspecific name": "infraspecific names",
};
const rankLabelPlural = (rank) => RANK_LABEL_PLURAL[rank] || rank;

const taxonLabel = (displayName, color) =>
  `<span style="display:inline-flex;align-items:center;gap:6px">` +
  `<span style="display:inline-block;width:10px;height:10px;background:${color};border:1px solid rgba(0,0,0,0.15);border-radius:2px"></span>` +
  `<span style="font-style:italic">${escapeHtml(displayName)}</span>` +
  `</span>`;

const epithet = (scientificName) => {
  if (!scientificName) return "";
  const tokens = scientificName.trim().split(/\s+/);
  return tokens[tokens.length - 1];
};

const italicLabel = (text) =>
  `<span style="font-style:italic">${escapeHtml(text)}</span>`;

const DistributionsMap = ({
  records,
  onUnmappable,
  datasetKey,
  focalTaxon,
  rankOrder,
  basemap = DEFAULT_BASEMAP,
  gbifChecklistKey,
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerControlRef = useRef(null);
  const focalGroupRef = useRef(null);
  const tileLayerRef = useRef(null);
  const gbifLayerRef = useRef(null);

  const [descendantState, setDescendantState] = useState({
    status: "idle", // idle | loading | ready | empty | error
    taxa: [],
  });
  const [focalReady, setFocalReady] = useState(false);
  const [visibleTaxonIds, setVisibleTaxonIds] = useState(new Set());
  const fetchTriggeredRef = useRef(false);
  const descendantGroupsRef = useRef({}); // taxonId → L.featureGroup

  const presentMeans = useMemo(() => {
    if (!records?.length) return [];
    const seen = new Set();
    records.forEach((r) => {
      const k = resolveKey(r);
      if (k != null) seen.add(k);
    });
    return ESTABLISHMENT_MEANS.filter((m) => seen.has(m.key));
  }, [records]);

  const descendantLegend = useMemo(() => {
    if (descendantState.status !== "ready") {
      return { visibleGroups: [], unmappableGroups: [] };
    }
    const colors = assignColors(
      descendantState.taxa.filter((t) => t.mappable.length > 0),
      rankOrder || []
    );
    const decorate = (t) => ({
      ...t,
      color: colors[t.id],
      displayName: epithet(t.scientificName),
    });
    const groupByRank = (taxa) => {
      const byRank = {};
      taxa.forEach((t) => {
        (byRank[t.rank] = byRank[t.rank] || []).push(decorate(t));
      });
      return INFRASPECIFIC_RANKS.filter((r) => byRank[r]).map((r) => ({
        rank: r,
        label: rankLabelPlural(r),
        taxa: byRank[r],
      }));
    };
    const visibleGroups = groupByRank(
      descendantState.taxa.filter(
        (t) => t.mappable.length > 0 && visibleTaxonIds.has(t.id)
      )
    );
    const unmappableGroups = groupByRank(
      descendantState.taxa.filter((t) => t.mappable.length === 0)
    );
    return { visibleGroups, unmappableGroups };
  }, [descendantState, visibleTaxonIds, rankOrder]);

  const showDescendantLegend = descendantLegend.visibleGroups.length > 0;

  // Mount the map and the layer-tree control with base layers only.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      minZoom: 1,
      worldCopyJump: true,
    }).setView([20, 0], 2);
    mapRef.current = map;

    // The container may not yet have its final width when Leaflet initialises
    // (flex/grid layout, late-mounting parents). Invalidate once on the next
    // frame and again whenever the container resizes so tiles fill the canvas.
    const invalidate = () => map.invalidateSize();
    const raf = requestAnimationFrame(invalidate);
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(invalidate)
        : null;
    if (resizeObserver) resizeObserver.observe(containerRef.current);

    const control = L.control.layers
      .tree(null, [], {
        collapsed: true,
        position: "topright",
        closedSymbol: "+",
        openedSymbol: "",
        spaceSymbol: "",
      })
      .addTo(map);
    layerControlRef.current = control;

    let isMounted = true;
    const containerEl = control.getContainer();
    const triggerFetch = () => {
      if (fetchTriggeredRef.current) return;
      if (!datasetKey || !focalTaxon || !rankOrder) return;
      const focalRank = focalTaxon?.name?.rank;
      if (!focalRank) return;
      if (focalRank !== "species" && !INFRASPECIFIC_RANKS.includes(focalRank))
        return;
      const ranks = getDescendantRanks(focalRank, rankOrder);
      if (ranks.length === 0) return;
      fetchTriggeredRef.current = true;
      setDescendantState({ status: "loading", taxa: [] });
      fetchDescendants({ datasetKey, focalTaxon, rankOrder }).then(
        ({ taxa, descendantsFailed }) => {
          if (!isMounted) return;
          if (descendantsFailed) {
            setDescendantState({ status: "error", taxa: [] });
            return;
          }
          if (taxa.length === 0) {
            setDescendantState({ status: "empty", taxa: [] });
            return;
          }
          setDescendantState({ status: "ready", taxa });
        }
      );
    };
    containerEl.addEventListener("mouseenter", triggerFetch);
    containerEl.addEventListener("click", triggerFetch);

    // Track which descendant layers are currently visible (drives the legend).
    // Do NOT refit bounds here: user-driven layer toggles must preserve the
    // current zoom/pan.
    const recomputeVisible = () => {
      const ids = new Set();
      Object.entries(descendantGroupsRef.current).forEach(([id, g]) => {
        if (map.hasLayer(g)) ids.add(id);
      });
      setVisibleTaxonIds(ids);
    };
    map.on("overlayadd", recomputeVisible);
    map.on("overlayremove", recomputeVisible);

    return () => {
      isMounted = false;
      cancelAnimationFrame(raf);
      if (resizeObserver) resizeObserver.disconnect();
      containerEl.removeEventListener("mouseenter", triggerFetch);
      containerEl.removeEventListener("click", triggerFetch);
      map.off("overlayadd", recomputeVisible);
      map.off("overlayremove", recomputeVisible);
      map.remove();
      mapRef.current = null;
      layerControlRef.current = null;
      focalGroupRef.current = null;
      tileLayerRef.current = null;
      gbifLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const def = BASEMAPS.find((b) => b.key === basemap) || BASEMAPS[0];
    const newLayer = L.tileLayer(def.url, def.options).addTo(map);
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    tileLayerRef.current = newLayer;
    const max = def.options?.maxZoom;
    if (typeof max === "number" && map.getZoom() > max) {
      map.setZoom(max);
    }
  }, [basemap]);

  // Focal taxon polygons — rebuilt whenever `records` changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !records?.length) return;
    setFocalReady(false);
    let cancelled = false;
    const group = L.featureGroup();
    group.addTo(map);
    focalGroupRef.current = group;
    let failures = 0;

    Promise.allSettled(
      records.map((r) =>
        fetchShape(r.area.gazetteer, r.area.id).then((geojson) => ({
          record: r,
          geojson,
        }))
      )
    ).then((results) => {
      if (cancelled) return;
      let combinedBounds = null;
      results.forEach((res) => {
        if (res.status !== "fulfilled" || !res.value.geojson) {
          failures += 1;
          return;
        }
        const { record, geojson } = res.value;
        const baseStyle = polygonStyleFor(colorFor(record));
        const layer = L.geoJSON(geojson, {
          style: () => baseStyle,
          onEachFeature: (_feature, lyr) => {
            lyr.bindPopup(popupHtml(record));
            lyr.on("mouseover", () => lyr.setStyle(polygonHoverStyle));
            lyr.on("mouseout", () => lyr.setStyle(baseStyle));
          },
        });
        layer.addTo(group);
        const b = originalCopyBounds(layer);
        if (b) {
          combinedBounds = combinedBounds ? combinedBounds.extend(b) : b;
        }
      });
      if (combinedBounds && combinedBounds.isValid()) {
        map.fitBounds(combinedBounds, { padding: [10, 10] });
      }
      if (typeof onUnmappable === "function") {
        onUnmappable(failures);
      }
      setFocalReady(true);
    });

    return () => {
      cancelled = true;
      setFocalReady(false);
      group.remove();
      focalGroupRef.current = null;
    };
  }, [records, onUnmappable]);

  // GBIF occurrence layer for the focal taxon. Re-created when the
  // checklistKey or focal taxon changes; teardown removes it from the map
  // and from the layer-tree control.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (gbifLayerRef.current) {
      map.removeLayer(gbifLayerRef.current);
      gbifLayerRef.current = null;
    }
    if (!gbifChecklistKey || !focalTaxon?.id) return;
    if (!map.getPane(GBIF_PANE)) {
      map.createPane(GBIF_PANE);
      map.getPane(GBIF_PANE).style.zIndex = String(GBIF_PANE_Z);
      map.getPane(GBIF_PANE).style.pointerEvents = "none";
    }
    const url = GBIF_TILE_URL.replace(
      "{checklistKey}",
      encodeURIComponent(gbifChecklistKey)
    ).replace("{taxonKey}", encodeURIComponent(focalTaxon.id));
    const layer = L.tileLayer(url, {
      attribution:
        '<a href="https://www.gbif.org">GBIF</a> occurrence data',
      maxZoom: 19,
      opacity: 0.9,
      pane: GBIF_PANE,
    }).addTo(map);
    gbifLayerRef.current = layer;
    return () => {
      if (gbifLayerRef.current) {
        map.removeLayer(gbifLayerRef.current);
        gbifLayerRef.current = null;
      }
    };
  }, [gbifChecklistKey, focalTaxon?.id]);

  useEffect(() => {
    const map = mapRef.current;
    const control = layerControlRef.current;
    const focalGroup = focalGroupRef.current;
    if (!map || !control) return;

    const focalName = focalTaxon?.name?.scientificName || "";
    const overlayChildren = [];
    if (focalReady && focalGroup) {
      overlayChildren.push({
        label: italicLabel(focalName || "This taxon"),
        layer: focalGroup,
      });
    }
    if (gbifLayerRef.current) {
      overlayChildren.push({
        label: "GBIF occurrences",
        layer: gbifLayerRef.current,
      });
    }

    if (descendantState.status !== "ready") {
      control.setOverlayTree(overlayChildren);
      return;
    }

    const { taxa } = descendantState;
    const mappableTaxa = taxa.filter((t) => t.mappable.length > 0);
    const colors = assignColors(mappableTaxa, rankOrder || []);

    // Build a feature group per mappable taxon.
    const groups = {};
    mappableTaxa.forEach((t) => {
      const color = colors[t.id];
      const baseStyle = {
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.55,
      };
      const hoverStyle = { weight: 3, fillOpacity: 0.85 };
      const group = L.featureGroup();
      t.mappable.forEach((rec) => {
        fetchShape(rec.area.gazetteer, rec.area.id).then((geojson) => {
          if (!geojson) return;
          const lyr = L.geoJSON(geojson, {
            style: () => baseStyle,
            onEachFeature: (_f, l) => {
              const head = `<div style="font-weight:600;font-style:italic;margin-bottom:4px">${escapeHtml(
                t.scientificName
              )}</div><div style="color:#888;margin-bottom:4px">${escapeHtml(
                t.rank || ""
              )}</div>`;
              l.bindPopup(head + popupHtml(rec));
              l.on("mouseover", () => l.setStyle(hoverStyle));
              l.on("mouseout", () => l.setStyle(baseStyle));
            },
          });
          lyr.addTo(group);
        });
      });
      groups[t.id] = group;
    });
    descendantGroupsRef.current = groups;

    // Tree by rank: top-level group per rank present, with each individual
    // taxon as a child; if a taxon has lower-ranked descendants in the same
    // fetch, those appear as a nested sub-group ("<rank> of <name>").
    const tree = buildTree(
      taxa.map((t) => ({
        id: t.id,
        parentId: t.parentId,
        scientificName: t.scientificName,
        rank: t.rank,
      })),
      focalTaxon.id
    );

    const childrenOfTaxonNode = (taxonId) => {
      const kids = tree.byParent[taxonId] || [];
      const grouped = {};
      kids.forEach((k) => {
        (grouped[k.rank] = grouped[k.rank] || []).push(k);
      });
      const out = [];
      INFRASPECIFIC_RANKS.forEach((rank) => {
        const inGroup = grouped[rank];
        if (!inGroup) return;
        const parentTaxon = taxa.find((t) => t.id === taxonId);
        const parentDisplay = parentTaxon
          ? epithet(parentTaxon.scientificName)
          : "";
        const subLabel = `${rankLabelPlural(rank)} of ${escapeHtml(parentDisplay)}`;
        const childLeaves = inGroup
          .filter((k) => groups[k.id])
          .map((k) => {
            const nested = childrenOfTaxonNode(k.id);
            const node = {
              label: taxonLabel(epithet(k.scientificName), colors[k.id]),
              layer: groups[k.id],
            };
            if (nested.length > 0) node.children = nested;
            return node;
          });
        out.push({
          label: subLabel,
          selectAllCheckbox: true,
          children: childLeaves,
        });
      });
      return out;
    };

    // Top-level rank groups: every taxon of that rank across the whole subtree.
    const byRank = {};
    taxa.forEach((t) => {
      (byRank[t.rank] = byRank[t.rank] || []).push(t);
    });

    INFRASPECIFIC_RANKS.forEach((rank) => {
      const inRank = (byRank[rank] || []).filter((t) => groups[t.id]);
      if (inRank.length === 0) return;
      const children = inRank.map((t) => {
        const nested = childrenOfTaxonNode(t.id);
        const node = {
          label: taxonLabel(epithet(t.scientificName), colors[t.id]),
          layer: groups[t.id],
        };
        if (nested.length > 0) node.children = nested;
        return node;
      });
      overlayChildren.push({
        label: rankLabelPlural(rank),
        selectAllCheckbox: true,
        children,
      });
    });

    control.setOverlayTree(overlayChildren);

    return () => {
      Object.values(groups).forEach((g) => g.remove());
      descendantGroupsRef.current = {};
    };
  }, [descendantState, focalTaxon, rankOrder, focalReady, gbifChecklistKey]);

  return (
    <div className="col-distributions-map" style={{ position: "relative" }}>
      <style>{`
        .leaflet-bar a,
        .leaflet-bar a:hover {
          background-color: #fff;
        }
      `}</style>
      <div
        ref={containerRef}
        style={{ height: 360, width: "100%", background: "#f5f5f5" }}
      />
      {(descendantState.status === "loading" ||
        descendantState.status === "error") && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            zIndex: 1000,
            background: "#fff",
            borderRadius: 4,
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            padding: "4px 8px",
            fontSize: 12,
          }}
        >
          {descendantState.status === "loading" && "Loading descendants…"}
          {descendantState.status === "error" && (
            <>
              Couldn't load descendants.{" "}
              <a
                onClick={() => {
                  fetchTriggeredRef.current = false;
                  setDescendantState({ status: "idle", taxa: [] });
                }}
                style={{ cursor: "pointer" }}
              >
                Retry
              </a>
            </>
          )}
        </div>
      )}
      {!showDescendantLegend && presentMeans.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: 8,
            zIndex: 1000,
            background: "#fff",
            borderRadius: 4,
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            padding: "6px 8px",
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {presentMeans.map((m) => (
            <div
              key={m.key}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  background: m.color,
                  border: "1px solid rgba(0,0,0,0.15)",
                  borderRadius: 2,
                }}
              />
              <span>{m.label}</span>
            </div>
          ))}
        </div>
      )}
      {showDescendantLegend && (
        <IncludedTaxaLegend
          visibleGroups={descendantLegend.visibleGroups}
          unmappableGroups={descendantLegend.unmappableGroups}
        />
      )}
    </div>
  );
};

export default DistributionsMap;
