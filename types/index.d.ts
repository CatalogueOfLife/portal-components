// Hand-written type declarations for col-browser's public API.
// These cover the props of the exported components; the implementation is
// plain JS (see src/), so keep this file in sync by hand when props change.

import * as React from "react";
import type { ThemeConfig } from "antd";

/**
 * Navigation callbacks. Every routed component (all except <BibTex>) accepts
 * these. For each target you can wire an `onNavigateTo*` (SPA navigation) and/or
 * an `hrefFor*` (to render real anchors that support cmd/middle-click).
 * `args` is usually an id string; the tree and search targets may pass an object.
 */
export interface NavigationProps {
  onNavigateToTaxon?: (taxonKey: string) => void;
  hrefForTaxon?: (taxonKey: string) => string;
  onNavigateToTree?: (args: string | Record<string, unknown>) => void;
  hrefForTree?: (args: string | Record<string, unknown>) => string;
  onNavigateToSearch?: (filters: Record<string, unknown>) => void;
  hrefForSearch?: (filters: Record<string, unknown>) => string;
  onNavigateToSource?: (sourceDatasetKey: string) => void;
  hrefForSource?: (sourceDatasetKey: string) => string;
}

/** Optional Ant Design theming, applied via a ConfigProvider when present. */
export interface ThemeProps {
  /** A full antd ThemeConfig, forwarded straight to ConfigProvider. */
  theme?: ThemeConfig;
  /** Convenience flag; applies antd's darkAlgorithm unless `theme.algorithm` is set. */
  darkMode?: boolean;
}

/** The dataset (catalogue) the component reads from. */
export interface DatasetKeyProps {
  datasetKey?: string | number;
  /** @deprecated renamed to `datasetKey`. */
  catalogueKey?: string | number;
}

export interface TreeProps
  extends DatasetKeyProps,
    ThemeProps,
    NavigationProps {
  defaultTaxonKey?: string;
  expandedTaxonKey?: string;
  onExpandedTaxonKeyChange?: (taxonKey: string | null) => void;
  showTreeOptions?: boolean;
  linkToSpeciesPage?: boolean;
  citation?: "top" | "bottom";
  type?: string;
  /** Render a placeholder row for incomplete branches. Defaults to true. */
  insertPlaceholder?: boolean;
  /** HTTP Basic Auth credentials in `user:password` form. */
  auth?: string;
}

export interface SearchProps
  extends DatasetKeyProps,
    ThemeProps,
    NavigationProps {
  filters?: Record<string, unknown>;
  onFiltersChange?: (filters: Record<string, unknown>) => void;
  defaultTaxonKey?: string;
  citation?: string;
  /** HTTP Basic Auth credentials in `user:password` form. */
  auth?: string;
}

export interface TaxonProps
  extends DatasetKeyProps,
    ThemeProps,
    NavigationProps {
  taxonKey?: string;
  /** Document title template; `__taxon__` is replaced with the taxon label. */
  pageTitleTemplate?: string;
  identifierLabel?: string;
  showDistributionMap?: boolean;
  gbifChecklistKey?: string | number;
  /** HTTP Basic Auth credentials in `user:password` form. */
  auth?: string;
}

export interface SourceDatasetProps
  extends DatasetKeyProps,
    ThemeProps,
    NavigationProps {
  sourceDatasetKey?: string | number;
  pageTitleTemplate?: string;
  /** HTTP Basic Auth credentials in `user:password` form. */
  auth?: string;
}

export interface SourceDatasetListProps
  extends DatasetKeyProps,
    ThemeProps,
    NavigationProps {
  /** HTTP Basic Auth credentials in `user:password` form. */
  auth?: string;
}

export interface BibTexProps extends ThemeProps {
  datasetKey?: string | number;
  sourceDatasetKey?: string | number;
  /** @deprecated pass the catalogue as `datasetKey` and the source as `sourceDatasetKey`. */
  catalogueKey?: string | number;
  style?: React.CSSProperties;
}

export interface TaxonBreakdownProps extends ThemeProps, NavigationProps {
  taxonId?: string;
  datasetKey?: string | number;
  /** Breakdown depth. Defaults to 1. */
  level?: number;
  showLevelSwitch?: boolean;
  /** HTTP Basic Auth credentials in `user:password` form. */
  auth?: string;
}

export interface TaxonDistributionProps extends ThemeProps, NavigationProps {
  taxonId?: string;
  datasetKey?: string | number;
  gbifChecklistKey?: string | number;
  style?: React.CSSProperties;
  /** HTTP Basic Auth credentials in `user:password` form. */
  auth?: string;
}

export const Tree: React.FC<TreeProps>;
export const Search: React.FC<SearchProps>;
export const Taxon: React.FC<TaxonProps>;
export const SourceDataset: React.FC<SourceDatasetProps>;
export const SourceDatasetList: React.FC<SourceDatasetListProps>;
export const BibTex: React.FC<BibTexProps>;
export const TaxonBreakdown: React.FC<TaxonBreakdownProps>;
export const TaxonDistribution: React.FC<TaxonDistributionProps>;

export interface WithRoutingOptions {
  kind:
    | "taxon"
    | "source"
    | "sourceList"
    | "tree"
    | "search"
    | "taxonBreakdown"
    | "taxonDistribution"
    | "bibtex";
  /** "path" (recommended for the COL portal) or "hash". Defaults to "path". */
  mode?: "path" | "hash";
  /** "spa" (history.pushState, default) or "reload". */
  navigation?: "spa" | "reload";
  /** Per-kind URL prefixes used to read/write the controlled identifier. */
  paths?: Partial<Record<WithRoutingOptions["kind"], string>>;
}

/**
 * Wraps a component so its controlled identifier (taxonKey, filters, …) is
 * derived from and written back to the URL.
 */
export function withRouting<P extends object>(
  Component: React.ComponentType<P>,
  options: WithRoutingOptions
): React.FC<P>;
