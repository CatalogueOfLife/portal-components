import React, { useState, useEffect, useMemo, useCallback } from "react";
import qs from "query-string";

// withRouting(Component, options): adapts a controlled col-browser
// component to read/write the host page's URL.
//
//   options.kind        — one of "taxon" | "tree" | "source" | "sourceList" |
//                         "search" | "taxonBreakdown" | "taxonDistribution" |
//                         "bibtex"
//   options.mode        — "path" (recommended for the COL portal) or "hash"
//                         (used by the GitHub Pages demo)
//   options.navigation  — "spa" (default) or "reload". Controls what the four
//                         onNavigateToX callbacks do when an in-component
//                         action triggers cross-page navigation (e.g. a
//                         Highcharts pie segment click with no <a href>
//                         fallback). "spa" uses history.pushState — right
//                         for SPA hosts (react-router, Next.js, TanStack
//                         Router). "reload" calls window.location.assign,
//                         forcing the browser to load the target page —
//                         right for static / multi-page hosts (a Jekyll
//                         portal, the GitHub Pages demo, any plain HTML).
//                         The in-component state callbacks
//                         (onExpandedTaxonKeyChange, onFiltersChange) always
//                         use pushState so they don't reload the page while
//                         the user is interacting with a single component.
//   options.paths       — prefix strings for the four navigation targets, e.g.
//                         { taxon: "/taxon/", tree: "/tree", search: "/search",
//                         source: "/source/" }. For hash mode, the prefixes
//                         are applied to window.location.hash (without the
//                         leading #). Both modes use plain pathnames; query
//                         strings are only used for `expandedTaxonKey` (Tree)
//                         and `filters` (Search).
//
// All wrappers provide the four hrefForX + onNavigateToX pairs, derived
// from `paths` and the active routing mode. Kind-specific wrappers also
// inject the controlled identifier and the appropriate change handler
// (e.g. `filters` + `onFiltersChange` for Search).

const isHash = (mode) => mode === "hash";

const readLocationKind = (mode) => {
  if (isHash(mode)) {
    const raw = (typeof window !== "undefined" && window.location.hash) || "";
    const hash = raw.startsWith("#") ? raw.slice(1) : raw;
    const qIdx = hash.indexOf("?");
    return {
      path: qIdx >= 0 ? hash.slice(0, qIdx) : hash,
      search: qIdx >= 0 ? hash.slice(qIdx) : "",
    };
  }
  return {
    path: (typeof window !== "undefined" && window.location.pathname) || "",
    search: (typeof window !== "undefined" && window.location.search) || "",
  };
};

const writeLocation = (mode, path, search) => {
  const searchStr = search && Object.keys(search).length > 0
    ? `?${qs.stringify(search, { arrayFormat: "none" })}`
    : "";
  if (isHash(mode)) {
    const next = `${path}${searchStr}`;
    window.location.hash = next;
  } else {
    const url = `${path}${searchStr}`;
    window.history.pushState(null, "", url);
    // notify any listeners (the adapter subscribes via popstate / hashchange)
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
};

const subscribe = (mode, cb) => {
  const evt = isHash(mode) ? "hashchange" : "popstate";
  window.addEventListener(evt, cb);
  return () => window.removeEventListener(evt, cb);
};

// Build href: the URL the host would land on for each target.
const hrefFor = (mode, prefix, args) => {
  if (!prefix) return null;
  const arg = args == null ? "" : typeof args === "object" ? "" : String(args);
  const tail = typeof args === "object" && args && Object.keys(args).length > 0
    ? `?${qs.stringify(args, { arrayFormat: "none" })}`
    : "";
  const url = `${prefix}${arg}${tail}`;
  return isHash(mode) ? `#${url}` : url;
};

const navigate = (mode, navigation, prefix, args) => {
  if (!prefix) return;
  if (navigation === "reload") {
    // Force a real browser navigation. hrefFor builds the same URL the
    // adapter would render in href= attributes, so the imperative and
    // anchor paths land on identical URLs.
    const url = hrefFor(mode, prefix, args);
    if (url != null && typeof window !== "undefined") {
      window.location.assign(url);
    }
    return;
  }
  // Default "spa" behaviour: pushState + popstate so an SPA host re-renders.
  let path = prefix;
  let search = null;
  if (typeof args === "string" || typeof args === "number") {
    path = `${prefix}${args}`;
  } else if (args && typeof args === "object") {
    search = args;
  }
  writeLocation(mode, path, search);
};

const buildNavProps = (mode, navigation, paths) => ({
  hrefForTaxon:  (id) => hrefFor(mode, paths.taxon, id),
  hrefForTree:   (a)  => hrefFor(mode, paths.tree, a),
  hrefForSearch: (a)  => hrefFor(mode, paths.search, a),
  hrefForSource: (id) => hrefFor(mode, paths.source, id),

  onNavigateToTaxon:  (id) => navigate(mode, navigation, paths.taxon, id),
  onNavigateToTree:   (a)  => navigate(mode, navigation, paths.tree, a),
  onNavigateToSearch: (a)  => navigate(mode, navigation, paths.search, a),
  onNavigateToSource: (id) => navigate(mode, navigation, paths.source, id),
});

// Extract the last path segment after a prefix, ignoring trailing slash.
const lastSegmentAfter = (path, prefix) => {
  if (!prefix) return undefined;
  if (!path.startsWith(prefix)) {
    // Allow matching when the host wraps in a base path; fall back to
    // "anything after the prefix substring".
    const i = path.indexOf(prefix);
    if (i < 0) return undefined;
    return path.slice(i + prefix.length).split("/").filter(Boolean).pop();
  }
  return path.slice(prefix.length).split("/").filter(Boolean).pop();
};

export function withRouting(Component, options) {
  const { kind, mode = "path", navigation = "spa", paths = {} } = options;

  const Wrapped = (props) => {
    const [tick, setTick] = useState(0);
    useEffect(() => subscribe(mode, () => setTick((t) => t + 1)), []);

    const { path, search } = readLocationKind(mode);

    const navProps = useMemo(() => buildNavProps(mode, navigation, paths), []);

    // Controlled identifier per kind.
    let extra = {};
    if (kind === "taxon") {
      extra.taxonKey = lastSegmentAfter(path, paths.taxon);
    } else if (kind === "source") {
      extra.sourceDatasetKey = lastSegmentAfter(path, paths.source);
    } else if (kind === "taxonBreakdown") {
      extra.taxonId = lastSegmentAfter(path, paths.taxonBreakdown);
    } else if (kind === "taxonDistribution") {
      extra.taxonId = lastSegmentAfter(path, paths.taxonDistribution);
    } else if (kind === "bibtex") {
      extra.sourceDatasetKey = lastSegmentAfter(path, paths.bibtex);
    } else if (kind === "tree") {
      const parsed = qs.parse(search);
      extra.expandedTaxonKey = parsed.taxonKey || undefined;
      extra.onExpandedTaxonKeyChange = useCallback((id) => {
        const cur = readLocationKind(mode);
        const next = qs.parse(cur.search);
        if (id) next.taxonKey = id;
        else delete next.taxonKey;
        writeLocation(mode, cur.path || paths.tree || "/", next);
      }, []);
    } else if (kind === "search") {
      const parsed = qs.parse(search, { arrayFormat: "none" });
      extra.filters = parsed;
      extra.onFiltersChange = useCallback((filters) => {
        const cur = readLocationKind(mode);
        writeLocation(mode, cur.path || paths.search || "/", filters);
      }, []);
    }
    // sourceList: no controlled identifier; only nav callbacks.

    return <Component {...navProps} {...extra} {...props} />;
  };
  Wrapped.displayName = `withRouting(${
    Component.displayName || Component.name || "Component"
  })`;
  return Wrapped;
}

export default withRouting;
