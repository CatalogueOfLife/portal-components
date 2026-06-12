# CLAUDE.md

## Project overview

React 19 component library (`col-browser`) providing browse/search UI components for Catalogue of Life portals. Built with Ant Design 6. Distributed as ES module and UMD bundles via Vite.

## Commands

```bash
npm run dev        # serve demo app with live reload (Vite)
npm test           # run tests once (Vitest, jsdom)
npm run test:watch # run tests in watch mode
npm run build      # build ES module bundle
npm run build:umd  # build UMD bundle + minified version
npm run build:all  # build both ES and UMD bundles (runs on npm publish)
```

## Architecture

- **`src/index.js`** — public exports (re-exported from `src/entries/*`): `Tree`, `Search`, `Taxon`, `TaxonBreakdown`, `TaxonDistribution`, `SourceDataset`, `SourceDatasetList`, `BibTex`, and the `withRouting` URL adapter.
- **`src/umd.js`** — UMD entry point; same exports under the `ColBrowser` global, which also re-exposes the bundled `React` and `ReactDOM` (React 19 ships no UMD build of its own).
- **`src/config.js`** — `dataApi` base URL (https://api.checklistbank.org/)
- **`src/api/`** — axios wrappers around the ChecklistBank API
- **`src/url/index.js`** — the `withRouting` adapter; the only place react-router-dom (v7) is used.

Each component lives in its own directory (`src/Tree/`, `src/Search/`, etc.), a mix of class and function/hook components. As of v2 the components are **fully controlled**: they take their identifier and navigation as props and never read or write the URL themselves (the old shared `history` singleton was removed). Host URL wiring is opt-in via the `withRouting` adapter.

## Toolchain

- **Vite 6** — dev server and Rollup-based library builds
- **Vitest** — test runner using jsdom environment
- **`vite.config.js`** — ES build + Vitest config
- **`vite.config.umd.js`** — UMD build config
- **`demo/index.html`** — HTML entry for the dev server
- **`Jenkinsfile`** — CI pipeline: `npm ci` → `npm test`
- **`.github/workflows/pages.yml`** — rebuilds and redeploys the GitHub Pages demo on every `v*` tag push
- Source files use JSX in `.js` files; a custom `jsx-in-js` Vite plugin (in each config) handles the transform via esbuild

## Testing

Test files must be named `*.test.js` or `*.spec.js`. All tests live in `tests/`.

Write Vitest-style tests using arrow functions (no `this.timeout()` needed — timeout is set globally in `vite.config.js`):

```js
describe('MyComponent', () => {
  it('does something', () => { ... })
})
```

`tests/setup.js` stubs `ResizeObserver` and `matchMedia` for jsdom so antd components don't throw.

## API

Production: `https://api.checklistbank.org/` — used in tests and at runtime.
Dev/staging: `https://api.dev.checklistbank.org/` — useful for checking OpenAPI schema changes.

Test catalogue key: `310463` (the main COL project dataset). Root taxon key: `V`.
