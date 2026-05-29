import { describe, it, expect, beforeEach } from "vitest";
import axios from "axios";
import client, { setAuth } from "../src/api/client";

describe("api/client auth", () => {
  beforeEach(() => setAuth(null));

  it("sets HTTP Basic auth on the dedicated client instance", () => {
    setAuth("user:pass");
    expect(client.defaults.headers.common["Authorization"]).toBe(
      `Basic ${btoa("user:pass")}`
    );
  });

  it("does NOT mutate the global axios defaults (no host leakage)", () => {
    setAuth("user:pass");
    expect(axios.defaults.headers.common["Authorization"]).toBeUndefined();
  });

  it("clears auth when called with a falsy value", () => {
    setAuth("user:pass");
    setAuth(null);
    expect(client.defaults.headers.common["Authorization"]).toBeUndefined();
  });
});
