// Hand-written declarations for col-browser/map: the distribution map and the
// helpers behind it. Keep in sync with src/entries/map.js by hand.

import * as React from "react";

export type AreaVariant = "land" | "eez";

export interface Area {
  gazetteer?: string;
  id?: string;
  globalId?: string;
  name?: string;
}

export interface DistributionRecord {
  area?: Area;
  establishmentMeans?: string;
  [key: string]: unknown;
}

export interface FocalTaxon {
  id: string;
  name?: { scientificName?: string; rank?: string };
  /** Marine taxa open the map on countries with their EEZ. */
  environments?: string[];
  [key: string]: unknown;
}

export interface DistributionsMapProps {
  /** Mappable distributions of the focal taxon (see `isMappable`). Keep the array stable: a new one refits the view. */
  records: DistributionRecord[];
  /** Called with the number of records whose shape could not be loaded. */
  onUnmappable?: (failures: number) => void;
  datasetKey: string | number;
  focalTaxon: FocalTaxon;
  /** Rank names in order, as from `vocab/rank`, for the infraspecific layers. */
  rankOrder: string[];
  /** GBIF checklist of the occurrence layer; without one there is no layer. */
  gbifChecklistKey?: string;
  /** The taxon key in that checklist. Defaults to the focal taxon's id. */
  gbifTaxonKey?: string;
  /** false greys out the GBIF layer, e.g. when GBIF has no occurrences. Defaults to true. */
  gbifAvailable?: boolean | null;
  /** MapLibre style URL or inline style object; defaults to `configure({ basemapStyle })`. */
  basemapStyle?: string | Record<string, unknown>;
  /** Shown as a link in the notice without WebGL. */
  onShowList?: () => void;
  /** Text of that link. Defaults to "Show distributions as a list". */
  showListLabel?: React.ReactNode;
  /** Loads descendants and their distributions; defaults to the library's client. */
  fetchJson?: (url: string) => Promise<any>;
}

export declare const DistributionsMap: React.ComponentType<DistributionsMapProps>;

export declare const AreaVariantSwitch: React.ComponentType<{
  value: AreaVariant;
  onChange: (value: AreaVariant) => void;
  style?: React.CSSProperties;
}>;

export declare function isWebglSupported(): boolean;
export declare function isMappable(record: DistributionRecord): boolean;

export declare const LAND: "land";
export declare const EEZ: "eez";
/** Only 2-letter iso countries have an EEZ variant. */
export declare function hasEezVariant(area: Area | null | undefined): boolean;
export declare function shapeUrl(area: Area, variant?: AreaVariant): string;
/** The GeoJSON shape of an area, cached per URL; null when it can't be loaded. */
export declare function fetchShape(area: Area, variant?: AreaVariant): Promise<any | null>;
export declare function isMarine(environments: string[] | null | undefined): boolean;
export declare function defaultVariant(environments: string[] | null | undefined): AreaVariant;

export declare const ESTABLISHMENT_MEANS: { key: string; label: string; color: string }[];
export declare const MISSING_COLOR: string;
export declare function meansKey(value: unknown): string | null;
export declare function meansColor(value: unknown): string;

type Bounds = [[number, number], [number, number]];
export declare function computeBounds(features: any[]): Bounds | null;
export declare function computeWrappedBounds(features: any[]): Bounds | null;
export declare function flattenFeatures(geojson: any): any[];
export declare const VIVID_PALETTE: string[];

/** The Catalogue of Life in GBIF, keyed by the taxon ids of the latest COL extended release. */
export declare const GBIF_COL_CHECKLIST: string;
export declare function gbifTileUrl(checklistKey: string, taxonKey: string): string;
export declare function gbifSearchUrl(checklistKey: string, taxonKey: string): string;
export declare function fetchGbifCount(checklistKey: string, taxonKey: string): Promise<number | null>;
/** null while loading, without keys or when GBIF fails. */
export declare function useGbifCount(
  checklistKey: string | null | undefined,
  taxonKey: string | null | undefined
): number | null;
export declare const GbifLegendEntry: React.ComponentType<{ style?: React.CSSProperties }>;
export declare function resolveBasemapStyle(
  prop?: string | Record<string, unknown>
): string | Record<string, unknown>;
