const config = {
    dataApi: "https://api.checklistbank.org/",
    // Human-facing ChecklistBank portal. Used for outbound links to
    // dataset / publisher pages we don't host ourselves.
    clbPortal: "https://www.checklistbank.org",
    // GBIF API base (no trailing slash). Used for the occurrence count and
    // the v2 map tile endpoint.
    gbifApi: "https://api.gbif.org",
    // GBIF human-facing portal where the attribution link points. The
    // multitaxonomy occurrence search now ships on the production portal.
    gbifPortal: "https://www.gbif.org",
};

// `dataApi` is concatenated with bare paths (`${dataApi}dataset/…`) so it must
// end with a slash; the others are concatenated with paths that carry their own
// leading slash, so they must not. Normalising here means callers can pass
// either form without breaking every URL the components build.
const SLASH_TERMINATED = new Set(["dataApi"]);

const normalize = (key, value) =>
    SLASH_TERMINATED.has(key)
        ? value.replace(/\/*$/, "/")
        : value.replace(/\/+$/, "");

/**
 * Override the base URLs the components talk to, e.g. to point them at the
 * ChecklistBank dev API. Merges into the shared config, so keys left out keep
 * their current value. Call once before rendering.
 *
 *   configure({ dataApi: "https://api.dev.checklistbank.org/" })
 */
export function configure(overrides = {}) {
    Object.entries(overrides).forEach(([key, value]) => {
        config[key] = typeof value === "string" ? normalize(key, value) : value;
    });
    return config;
}

export default config;
