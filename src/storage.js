// Persistent user settings, backed by localStorage and namespaced under the
// "col-browser:" key prefix. SSR-safe (no-ops without window) and resilient to
// private-mode / disabled / quota-exceeded storage. Values are JSON-encoded.
//
// Used for the small set of UI preferences worth remembering across sessions:
//   gbif-visible        – distribution map GBIF overlay on/off
//   breakdown-level     – taxon breakdown ring depth (1/2)
//   tree-show-source    – tree "Source" toggle
//   tree-extant-only    – tree "Extant only" toggle
//   search-content-type – search Content filter (All/Base/Extended)
const PREFIX = "col-browser:";

export function readSetting(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeSetting(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore: SSR (no window), private mode, or quota exceeded
  }
}
