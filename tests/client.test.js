import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import client, { setAuth, publicClient } from "../src/api/client";

// Build a minimal fetch Response stand-in.
const makeRes = ({
  ok = true,
  status = 200,
  data = {},
  contentType = "application/json",
  url = "https://api.example/x",
} = {}) => ({
  ok,
  status,
  url,
  headers: { get: (h) => (h.toLowerCase() === "content-type" ? contentType : null) },
  json: async () => data,
  text: async () => (typeof data === "string" ? data : JSON.stringify(data)),
});

const lastCall = () => fetch.mock.calls[fetch.mock.calls.length - 1];
const lastInit = () => lastCall()[1] || {};

describe("api/client (fetch wrapper)", () => {
  beforeEach(() => {
    setAuth(null);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeRes({ data: { ok: true } })));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("GETs a URL and resolves to { data } parsed from JSON", async () => {
    fetch.mockResolvedValueOnce(makeRes({ data: { hello: "world" } }));
    const res = await client("https://api.example/thing");
    expect(lastCall()[0]).toBe("https://api.example/thing");
    expect(lastInit().method).toBe("GET");
    expect(res.data).toEqual({ hello: "world" });
  });

  it("sends Basic auth on the default client once setAuth is set", async () => {
    setAuth("user:pass");
    await client("https://api.example/thing");
    expect(lastInit().headers.Authorization).toBe(`Basic ${btoa("user:pass")}`);
  });

  it("does NOT send auth from publicClient even when setAuth is set", async () => {
    setAuth("user:pass");
    await publicClient.get("https://gbif.example/occurrence");
    expect(lastInit().headers?.Authorization).toBeUndefined();
  });

  it("does NOT mutate the host's global axios/fetch state across clients", async () => {
    setAuth("user:pass");
    await client("https://api.example/a");
    setAuth(null);
    await client("https://api.example/b");
    expect(lastInit().headers?.Authorization).toBeUndefined();
  });

  it("throws an axios-shaped error on non-2xx (response.status + response.data)", async () => {
    fetch.mockResolvedValueOnce(
      makeRes({ ok: false, status: 404, data: { code: 404, message: "not found" } })
    );
    await expect(client("https://api.example/missing")).rejects.toMatchObject({
      response: { status: 404, data: { code: 404, message: "not found" } },
    });
  });

  it("network errors throw with no `response` (so 404 checks are safe)", async () => {
    fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    let err;
    try {
      await client("https://api.example/down");
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(Error);
    expect(err.response).toBeUndefined();
  });

  it("serializes a params object into the query string (skipping null/undefined)", async () => {
    await publicClient.get("https://gbif.example/search", {
      params: { taxonKey: 5, limit: 0, missing: undefined },
    });
    const url = lastCall()[0];
    expect(url).toContain("taxonKey=5");
    expect(url).toContain("limit=0");
    expect(url).not.toContain("missing");
  });

  it("passes custom request headers through", async () => {
    await client("https://api.example/area", {
      headers: { Accept: "application/geo+json" },
    });
    expect(lastInit().headers.Accept).toBe("application/geo+json");
  });

  it("POSTs a JSON body with application/json content type", async () => {
    await publicClient.post("https://api.example/feedback", { msg: "hi" });
    expect(lastInit().method).toBe("POST");
    expect(lastInit().body).toBe(JSON.stringify({ msg: "hi" }));
    expect(lastInit().headers["Content-Type"]).toBe("application/json");
  });

  it("parses application/geo+json (structured-suffix JSON) as an object, not text", async () => {
    const featureCollection = { type: "FeatureCollection", features: [] };
    fetch.mockResolvedValueOnce(
      makeRes({ data: featureCollection, contentType: "application/geo+json" })
    );
    const res = await client("https://api.example/vocab/area/iso:DE", {
      headers: { Accept: "application/geo+json" },
    });
    // Regression: the distribution map's GeoJSON shapes come back as
    // application/geo+json; they must be parsed, not returned as a string.
    expect(typeof res.data).toBe("object");
    expect(res.data).toEqual(featureCollection);
  });
});
