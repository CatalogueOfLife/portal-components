import { describe, expect, it } from "vitest";
import {
  GBIF_COL_CHECKLIST,
  gbifSearchUrl,
  gbifTileUrl,
} from "src/Taxon/DistributionsMap/gbif";

describe("gbif urls", () => {
  it("carries the checklist and taxon", () => {
    const tile = gbifTileUrl(GBIF_COL_CHECKLIST, "4GK65");
    expect(tile).toMatch(/^https:\/\/api\.gbif\.org\/v2\/map\/occurrence\/density\/\{z\}\/\{x\}\/\{y\}@1x\.png\?/);
    expect(tile).toContain(`checklistKey=${GBIF_COL_CHECKLIST}&taxonKey=4GK65`);
    expect(gbifSearchUrl(GBIF_COL_CHECKLIST, "a b")).toContain("taxon_key=a%20b");
  });
});
