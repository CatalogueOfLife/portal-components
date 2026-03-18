# CLAUDE.md

## Project overview

React 16.x component library (`col-browser`) providing browse/search UI components for Catalogue of Life portals. Built with Ant Design 4.6.1. Distributed as ES module and UMD bundles via Vite.

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

- **`src/index.js`** — public exports: `Tree`, `Search`, `Taxon`, `Dataset`, `DatasetSearch`, `BibTex`
- **`src/umd.js`** — UMD entry point; same exports under the `ColBrowser` global
- **`src/config.js`** — `dataApi` base URL (https://api.checklistbank.org/)
- **`src/api/`** — axios wrappers around the ChecklistBank API
- **`src/history.js`** — shared `history` v4 instance (used by all routed components)

Each component lives in its own directory (`src/Tree/`, `src/Search/`, etc.) as React 16 class components using react-router-dom v5 for URL-driven state.

## Toolchain

- **Vite 6** — dev server and Rollup-based library builds
- **Vitest** — test runner using jsdom environment
- **`vite.config.js`** — ES build + Vitest config
- **`vite.config.umd.js`** — UMD build config
- **`demo/index.html`** — HTML entry for the dev server
- **`Jenkinsfile`** — CI pipeline: `npm ci` → `npm test`
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
