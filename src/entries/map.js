// The distribution map and the helpers behind it, for hosts that render their
// own distribution block (the ChecklistBank UI). Unthemed: the host's antd
// theme applies. Needs maplibre-gl, with its worker URL set by the host.
export { default as DistributionsMap } from "../Taxon/DistributionsMap";
export { default as AreaVariantSwitch } from "../Taxon/DistributionsMap/AreaVariantSwitch";
export { isWebglSupported } from "../Taxon/DistributionsMap/webgl";
export { isMappable } from "../Taxon/DistributionsMap/descendantFetch";
export {
  LAND,
  EEZ,
  hasEezVariant,
  shapeUrl,
  fetchShape,
  isMarine,
  defaultVariant,
} from "../Taxon/DistributionsMap/areaShapes";
export {
  ESTABLISHMENT_MEANS,
  MISSING_COLOR,
  meansKey,
  meansColor,
} from "../Taxon/DistributionsMap/establishmentMeans";
export {
  computeBounds,
  computeWrappedBounds,
  flattenFeatures,
} from "../Taxon/DistributionsMap/geo";
export { VIVID_PALETTE } from "../Taxon/DistributionsMap/colorAssignment";
export {
  GBIF_COL_CHECKLIST,
  gbifTileUrl,
  gbifSearchUrl,
  fetchGbifCount,
  useGbifCount,
  GbifLegendEntry,
} from "../Taxon/DistributionsMap/gbif";
export { resolveBasemapStyle } from "../Taxon/DistributionsMap/basemap";
