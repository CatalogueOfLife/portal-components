// Type-level tests for the public type declarations (types/index.d.ts).
// Run with `npm run typecheck` (tsc). This file is NOT shipped (tests/ is
// excluded from package "files") and is NOT executed by vitest (its name does
// not match the *.test.{js,jsx} include pattern).
//
// The `@ts-expect-error` lines are drift detectors: if a prop these reject ever
// becomes valid, the directive goes unused and tsc fails — forcing the .d.ts
// and the components to be reconciled.
import {
  Tree,
  Search,
  Taxon,
  SourceDataset,
  SourceDatasetList,
  BibTex,
  TaxonBreakdown,
  TaxonDistribution,
  withRouting,
  type TaxonProps,
  type NavigationProps,
} from "../types/index";

// --- valid usage (must compile) ---
export const valid = (
  <>
    <Tree
      datasetKey={310463}
      defaultTaxonKey="V"
      expandedTaxonKey="V"
      citation="top"
      showTreeOptions
      linkToSpeciesPage
      onExpandedTaxonKeyChange={(k) => void k}
      onNavigateToTaxon={(k) => void k}
      hrefForTaxon={(k) => `/taxon/${k}`}
      darkMode
    />
    <Search
      datasetKey={310463}
      filters={{ rank: "species" }}
      onFiltersChange={() => {}}
      auth="user:pass"
    />
    <Taxon
      datasetKey="310463"
      taxonKey="abc"
      pageTitleTemplate="__taxon__"
      showDistributionMap
      gbifChecklistKey={7707728}
    />
    <SourceDataset datasetKey={310463} sourceDatasetKey={1234} />
    <SourceDatasetList datasetKey={310463} auth="user:pass" />
    <BibTex datasetKey={310463} sourceDatasetKey={1234} style={{ height: 40 }} />
    <TaxonBreakdown datasetKey={310463} taxonId="V" level={2} showLevelSwitch />
    <TaxonDistribution datasetKey={310463} taxonId="V" gbifChecklistKey={7707728} />
  </>
);

export const Routed = withRouting(Taxon, {
  kind: "taxon",
  mode: "path",
  navigation: "spa",
  paths: { taxon: "/data/taxon" },
});

export const taxonProps: TaxonProps = { datasetKey: 1, auth: "user:pass" };
const nav: NavigationProps = { onNavigateToSource: (k) => void k };
void nav;

// --- negative cases (each @ts-expect-error MUST fire) ---
// @ts-expect-error citation only accepts "top" | "bottom"
const bad1 = <Tree datasetKey={1} citation="middle" />;
// @ts-expect-error unknown props are rejected
const bad2 = <Taxon datasetKey={1} notAProp />;
// @ts-expect-error level must be a number
const bad3 = <TaxonBreakdown datasetKey={1} level="2" />;
// @ts-expect-error withRouting requires `kind`
const bad4 = withRouting(Taxon, { mode: "path" });
// @ts-expect-error invalid routing kind
const bad5 = withRouting(Taxon, { kind: "nope" });
void bad1;
void bad2;
void bad3;
void bad4;
void bad5;
