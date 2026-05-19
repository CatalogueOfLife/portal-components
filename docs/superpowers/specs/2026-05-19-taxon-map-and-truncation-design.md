# Taxon component: distribution map + synonym/vernacular truncation

Date: 2026-05-19
Status: Draft, pending implementation

## Goal

Three changes to `<Taxon>`:

1. Truncate the Synonyms and Vernacular Names sections to 5 rows by default with a "Show all (N)" / "Show less" toggle.
2. Add an opt-in distribution map (Leaflet) that, when enabled and there is mappable data, is shown by default with a Map/List radio toggle.
3. Wire the map into the local demo, defaulting to Poa annua (6W3C4) in the COL catalogue.

The map component is ported from `clb-master/src/pages/Taxon/DistributionsMap.js`. Leaflet is added as a `peerDependency` so consumers explicitly load it (and its CSS) when they enable the map.

## Non-goals

- Sharing source files across the `clb-master` and `portal-components` repos via a published package. The map and the show-more toggle are copied; both repos own their copy.
- Rewriting the existing concatenated-text list view of distributions. It remains the fallback / non-map view.
- New tests. The library has minimal existing test coverage; manual verification in the demo is the bar for this change.

## Changes by file

### `src/Taxon/ShowMoreToggle.js` (new)

Port verbatim from `clb-master/src/pages/Taxon/ShowMoreToggle.js`. 12 lines, no dependencies. Renders an anchor that toggles between `Show all (N)` and `Show less`; returns `null` when `total <= visible && !showAll`.

### `src/Taxon/VernacularNames.js`

Currently a class component rendering an antd `<Table>` over `this.state.data`.

Add `showAll` to state (default `false`). Slice `data` to first 5 rows for the table's `dataSource` unless `showAll` is true. Render `<ShowMoreToggle total={data.length} visible={5} showAll={showAll} onChange={(v) => this.setState({showAll: v})} />` immediately below the table.

### `src/Taxon/Synonyms.js`

Currently iterates `data.homotypic` then `data.heterotypicGroups`, where `homotypic` is a flat list and each `heterotypicGroups[i]` is `[leader, ...nestedHomotypicMembers]`. Each rendered `<BorderedListItem>` is one line; nested members within a heterotypic group also each render their own line.

New behavior:

- Compute `total = homotypic.length + heterotypicGroups.reduce((n, g) => n + g.length, 0)`.
- Track a running counter while walking the same render order. Stop emitting list items once the counter reaches 5 (unless `showAll`). If the 5th line is a heterotypic group's leader, render the leader and stop — its nested members are not shown until expanded.
- Render `<ShowMoreToggle total={total} visible={5} showAll={showAll} onChange={setShowAll} />` after the list. The component should be converted to a function component with `useState`, or `showAll` can be added to a class state — either is fine; the file is small enough that a function-component conversion is the cleaner change.

### `src/Taxon/DistributionsMap.js` (new)

Port from `clb-master/src/pages/Taxon/DistributionsMap.js` with two adjustments:

- `import config from "../../config"` → `import config from "../config"` (portal-components has one less directory level).
- Remove the `import "leaflet/dist/leaflet.css"` line. CSS side-effect imports are awkward to externalize in Vite UMD builds; consumers load the CSS themselves (covered by the README + peer-dep contract).

Everything else — leaflet JS import, basemap radio, popup HTML, fetch caching, `onUnmappable` callback, establishment-means legend — stays identical.

### `src/Taxon/Distributions.js`

Rewrite to follow the clb-master pattern, adapted to portal-components' existing concatenated-text list as the "list" view.

- Accept new prop `showDistributionMap` (boolean).
- `isMappable = r => r?.area?.gazetteer !== "text" && !!r?.area?.globalId`.
- If `!showDistributionMap` or `mappable.length === 0` or all mappable shape fetches failed, render the existing concatenated-text list (current behavior unchanged — keep the `iso3Map` country-name lookup and `MergedDataBadge` rendering).
- Otherwise: an antd `Radio.Group` with `Map | List` (default `map`). The map view renders `<DistributionsMap records={mappable} onUnmappable={setFetchFailures} />`. Below the map, if there are unmappable records (text gazetteer + failed fetches), show a `+N distribution(s) not on map` anchor that switches the view to `list`. The list view is the existing concatenated-text rendering.

The existing `iso3Map` `useEffect` and JSX are preserved as the list-view body; they are extracted into a `ListView` sub-component so both branches can render it.

### `src/Taxon/index.js`

- Accept `showDistributionMap` from props.
- Pass it through: `<Distributions ... showDistributionMap={showDistributionMap} />`.

### `package.json`

- Add `"leaflet": "^1.9.4"` under `peerDependencies`.
- Add `"leaflet": "^1.9.4"` under `devDependencies` so the dev server and demo work locally.

### `vite.config.js` and `vite.config.umd.js`

Add to each config's `build.rollupOptions.external`:

- `"leaflet"`

For the UMD build (`vite.config.umd.js`), also add to `build.rollupOptions.output.globals`:

- `"leaflet": "L"`

This keeps the published bundles the same size whether or not `showDistributionMap` is used. Consumers who set the prop must load Leaflet (JS + CSS) themselves.

### `demo/src/index.js`

- Change the Taxon entry in `routes`: `{ path: "/data/taxon/6W3C4", label: "Taxon" }`.
- Pass `showDistributionMap` on the demo's `<Taxon>` element.
- Add `import "leaflet/dist/leaflet.css"` at the top so the dev server serves the CSS for the demo. (This is demo-only; the library's `DistributionsMap.js` no longer imports it.)

### `README.md`

Add a short note: enabling `<Taxon showDistributionMap />` requires the consumer to load Leaflet and its CSS (peer dependency). One example for UMD consumers (script + link tags) and one for ES module consumers (`npm install leaflet`, import the CSS).

## Behaviour summary

| State | Distributions rendering |
|---|---|
| `showDistributionMap` not set | Existing concatenated-text list. No change for current consumers. |
| `showDistributionMap` set, no mappable records | Concatenated-text list. (Silent fallback.) |
| `showDistributionMap` set, some mappable records | Map view by default. Radio toggle to List. Optional "+N not on map" link below the map. |
| `showDistributionMap` set, all map shape fetches fail | Falls through to list view automatically (`allMappableFailed` branch in clb-master). |

## Error handling

- Map shape fetches use `Promise.allSettled`; per-area failures increment the unmappable count rather than breaking the view.
- If a consumer enables `showDistributionMap` without loading Leaflet, the map throws at render time. This is intentional — the README documents the requirement and a loud failure beats a silent blank map. The non-map paths of `<Taxon>` are unaffected because Leaflet is only touched inside `DistributionsMap.js`, which is only mounted when the map view is active.

## Verification

Manual, in the demo (`npm run dev`):

1. Navigate to `/data/taxon/6W3C4` (Poa annua). Verify the map renders with multiple coloured regions and a legend.
2. Toggle to List view and back. Verify both views render distributions.
3. Navigate to a taxon with fewer than 5 synonyms and fewer than 5 vernacular names. Verify no "Show all" link appears.
4. Navigate to a taxon with many synonyms (e.g. one with large heterotypic groups). Verify the truncation counts rendered lines and the toggle reveals the rest.
5. Build (`npm run build:all`) and grep the resulting `es/` and `umd/` bundles for `leaflet` to confirm it is externalized.
