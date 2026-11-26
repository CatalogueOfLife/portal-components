import { describe, expect, it } from "vitest";
import config from "src/config";
import {
  defaultVariant,
  EEZ,
  hasEezVariant,
  isMarine,
  LAND,
  shapeUrl,
} from "src/Taxon/DistributionsMap/areaShapes";

describe("hasEezVariant", () => {
  it("accepts iso countries only", () => {
    expect(hasEezVariant({ gazetteer: "iso", id: "FR" })).toBe(true);
    expect(hasEezVariant({ gazetteer: "iso", id: "fr" })).toBe(true);
    expect(hasEezVariant({ gazetteer: "iso", id: "US-CA" })).toBe(false);
    expect(hasEezVariant({ gazetteer: "tdwg", id: "FR" })).toBe(false);
    expect(hasEezVariant({ gazetteer: "iso" })).toBe(false);
    expect(hasEezVariant(null)).toBe(false);
  });
});

describe("shapeUrl", () => {
  const base = `${config.dataApi}vocab/area/`;
  it("adds the variant to iso countries only", () => {
    expect(shapeUrl({ gazetteer: "iso", id: "FR" }, EEZ)).toBe(
      `${base}iso:FR.geojson?variant=eez`
    );
    expect(shapeUrl({ gazetteer: "iso", id: "FR" }, LAND)).toBe(
      `${base}iso:FR.geojson`
    );
    expect(shapeUrl({ gazetteer: "iso", id: "FR" })).toBe(
      `${base}iso:FR.geojson`
    );
    expect(shapeUrl({ gazetteer: "iso", id: "US-CA" }, EEZ)).toBe(
      `${base}iso:US-CA.geojson`
    );
    expect(shapeUrl({ gazetteer: "tdwg", id: "FRA" }, EEZ)).toBe(
      `${base}tdwg:FRA.geojson`
    );
  });
  it("encodes the id", () => {
    expect(shapeUrl({ gazetteer: "mrgid", id: "a b" })).toBe(
      `${base}mrgid:a%20b.geojson`
    );
  });
});

describe("defaultVariant", () => {
  it("uses the EEZ for marine taxa", () => {
    expect(isMarine(["marine"])).toBe(true);
    expect(defaultVariant(["terrestrial", "marine"])).toBe(EEZ);
    expect(defaultVariant(["MARINE"])).toBe(EEZ);
  });
  it("uses the land otherwise", () => {
    expect(defaultVariant(["terrestrial"])).toBe(LAND);
    expect(defaultVariant(["brackish", "freshwater"])).toBe(LAND);
    expect(defaultVariant([])).toBe(LAND);
    expect(defaultVariant(undefined)).toBe(LAND);
  });
});
