import { describe, expect, it } from "vitest";
import {
  MISSING_COLOR,
  meansColor,
  meansKey,
} from "src/Taxon/DistributionsMap/establishmentMeans";

describe("establishment means", () => {
  it("normalises values", () => {
    expect(meansKey("Native")).toBe("native");
    expect(meansKey("native endemic")).toBe("nativeendemic");
    expect(meansKey("weird")).toBe("uncertain");
    expect(meansKey("")).toBe(null);
    expect(meansKey(null)).toBe(null);
  });
  it("colours missing values apart", () => {
    expect(meansColor(undefined)).toBe(MISSING_COLOR);
    expect(meansColor("native")).toBe("#87C55F");
  });
});
