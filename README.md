# Dynamic components for Taxon browse and search

This is a small React Component library consisting of

1. Tree browser
2. Taxon search page, table view
3. Taxon page
4. Dataset page (Relevant for projects compiled from several source datasets providing taxonomic 'sectors' i.e. subtrees)
5. BibTex citation - simple icon that downloads a BibTex citation for a dataset

## Examples

### Catalogue of Life
All components are in use on the [main Catalogue of Life portal](https://www.catalogueoflife.org).

![tree](https://user-images.githubusercontent.com/327505/111465911-ed038200-8722-11eb-925c-4d836efe6e1b.png)

![search](https://user-images.githubusercontent.com/327505/111465903-ea089180-8722-11eb-985c-0cbaefba0880.png)

![details](https://user-images.githubusercontent.com/327505/111465894-e6750a80-8722-11eb-8bd7-005f41f023f3.png)

### Catalogue of the Pterophoroidea & Alucitoidea
 - https://pterophoroidea.hobern.net
 - https://alucitoidea.hobern.net

![tree](https://user-images.githubusercontent.com/327505/111465866-dceba280-8722-11eb-9368-31d056593058.png)


## Upgrading from 1.x to 2.0

v2.0 brings the React / Ant Design / React Router stack up to current versions. **Component props and behaviour are unchanged**, but embedders must update their host page in three places.

### 1. Load React 19 (was React 16)

```html
<!-- old (v1.x): React 16 -->
<script src="https://unpkg.com/react@16/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js"></script>

<!-- new (v2.x): React 19 -->
<script src="https://unpkg.com/react@19/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@19/umd/react-dom.production.min.js"></script>
```

### 2. Mount with `createRoot` (was `ReactDOM.render`)

React 19 removed the legacy `ReactDOM.render` API.

```js
// old (v1.x)
ReactDOM.render(e(Tree), document.querySelector('#tree'));

// new (v2.x)
ReactDOM.createRoot(document.querySelector('#tree')).render(e(Tree));
```

### 3. Keep loading the JS bundle alongside the CSS

Ant Design 5+ injects component styles via cssinjs at runtime when components mount. `umd/main.css` is now ~87 KB (was ~557 KB) — it only contains the library's custom overrides. The antd component styling now travels inside `col-browser.min.js`, so do **not** load just the CSS without the JS.

Net wire size for a typical embedder (`col-browser.min.js` + `main.css`) is roughly unchanged: ~532 KB → ~577 KB gzipped (+8 %).

### 4. If you call `history.listen` directly

Internal to the library this doesn't matter, but if your host page subscribes to the shared `history` singleton, the v5 listener signature changed from `(location, action)` to `({ location, action })`:

```js
// old (history@4)
history.listen((location) => { /* ... */ });
// new (history@5)
history.listen(({ location }) => { /* ... */ });
```

---

## Usage

> **Deprecation note:** the prop previously called `catalogueKey` is now called `datasetKey`. The old name still works (with a console warning) but will be removed in a future major release — please update embeddings.

These components can be included in any html page.
Include dependencies, React and React Dom:

```html
<script src="https://unpkg.com/react@19/umd/react.production.min.js" ></script>
<script src="https://unpkg.com/react-dom@19/umd/react-dom.production.min.js" ></script>
```

Include the Library — pin to a major so you don't get migrated unexpectedly:

```html
<script src="https://cdn.jsdelivr.net/gh/CatalogueOfLife/portal-components@2/umd/col-browser.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/CatalogueOfLife/portal-components@2/umd/main.css">
```

The full version list is on the [releases page](https://github.com/CatalogueOfLife/portal-components/releases).

### jsDelivr version selectors

jsDelivr resolves semver-style git tags, so you can pick the granularity that suits you:

| Selector | Resolves to | Use when |
|---|---|---|
| `@2` | latest 2.x release | recommended — gets bugfixes, no breaking changes |
| `@1` | latest 1.x release (React 16 / antd 4 era) | you can't yet migrate the host page to React 19 |
| `@v2.0.0` | exactly v2.0.0 | you need byte-for-byte reproducibility |
| `@latest` | most recent release across all majors | **avoid for production** — a future v3 release will silently migrate you |

> v1 is in maintenance mode on the [`v1`](https://github.com/CatalogueOfLife/portal-components/tree/v1) branch. Critical fixes will be backported there as v1.x patch releases; no new features.

After a versioned release, the `@latest`, `@1`, or `@2` URLs cache for up to ~12 h on the jsDelivr edge — purge them via <https://www.jsdelivr.com/tools/purge> if you need to roll out faster.


This will create a global `ColBrowser` library variable that has four indvidual components:

### ColBrowser.Tree

A [browsable taxonomic tree](https://www.catalogueoflife.org/data/browse), takes three properties:

1. `datasetKey` - the dataset key from the [Catalogue of Life ChecklistBank](https://www.checklistbank.org/)
2. `pathToTaxon` - The local path to the taxon page of your website (for links in the taxon tree to point towards). Alternatively, you can provide a callback function taking the taxonID as parameter as seen in [this example](https://github.com/CatalogueOfLife/portal-components/issues/27#issuecomment-1144524981).
3. `defaultTaxonKey` - (Optional) Initially expand the tree down to this taxon.
4. `pathToDataset` - (Optional, only relevant for datasets compiled from other source datasets) The local path to the source dataset page of your website (for links in the taxon tree to point towards).
5. `showTreeOptions` - (Optional) show toggles for extinct taxa and info (estimates, providers etc)
6. `linkToSpeciesPage`- (Optional) when the searchbox finds a species or infraspecific taxon, jump directly to the taxon page rather than opening the tree 
7. `citation` - (Optional) either "top" or "bottom" include the neccessary dataset citation above or below the tree component
8. `type` - (Optional) e.g. `type="project"` this will show info about contributing sources on the tree nodes

```html
<div id="tree"></div> <!- Dom element for the tree to attach to -->
............
<script >
'use strict';
const e = React.createElement;
class Tree extends React.Component {

    render() {

      return e(
        ColBrowser.Tree,
        { datasetKey: 9999,
          pathToTaxon: '/mytaxonomy/taxon/',
          defaultTaxonKey: 'urn:lsid:indexfungorum.org:names:814401',
          pathToDataset: '/sourcedatasets/' }
      );
    }
  }

const domContainer = document.querySelector('#tree');
ReactDOM.createRoot(domContainer).render(e(Tree));
</script>
```

### ColBrowser.Search

[Search component with table view](https://www.catalogueoflife.org/data/search), takes two properties:

1. `datasetKey` - the dataset key from the [Catalogue of Life ChecklistBank](https://www.checklistbank.org/)
2. `pathToTaxon` - The local path to the taxon page of your website (for links in the taxon tree to point towards).  Alternatively, you can provide a callback function taking the taxonID as parameter as seen in [this example](https://github.com/CatalogueOfLife/portal-components/issues/27#issuecomment-1144524981).
3. `defaultTaxonKey` - (Optional) if the search should default to a certain Family, Order etc
4. `citation` - (Optional) either "top" or "bottom" include the neccessary dataset citation above or below the search component

```html
<div id="search"></div> <!- Dom element for the search to attach to -->
............
<script >
'use strict';
const e = React.createElement;
class Search extends React.Component {

    render() {

      return e(
        ColBrowser.Search,
        { datasetKey: 9999,
          pathToTaxon: '/mytaxonomy/taxon/' }
      );
    }
  }

const domContainer = document.querySelector('#search');
ReactDOM.createRoot(domContainer).render(e(Search));
</script>
```

### ColBrowser.Taxon

[Taxon detail page](https://www.catalogueoflife.org/data/taxon/623QT), takes three properties:

1. `datasetKey` - the dataset key from the [Catalogue of Life ChecklistBank](https://www.checklistbank.org/)
2. `pathToTree` - The local path to the tree browser page of your website (for links in the taxon classification to point towards).
3. `pathToSearch` - The local path to the search page of your website (for links in the classification to point towards).
4. `pathToDataset` - (Optional, only relevant for datasets compiled from other source datasets) The local path to the source dataset page of your website (for links in the taxon tree to point towards).
5. `pathToTaxon=` - The local path to the taxon page of your website (the page where this component will placed).
6. `pageTitleTemplate` - A template for formatting the page title. It should be a string containg the variable `__taxon__` that will be replaced with the taxon name.
7. `identifierLabel` - Label for the identifier listed on top of the taxon view. Defaults to `Identifier`
8. `showDistributionMap` - (Optional) When `true`, render an interactive MapLibre GL map (CARTO Positron vector basemap) for distributions whose areas have a known geometry, with a toggle to switch to the plain text list view. **Requires the consumer to load MapLibre GL JS 4+ or 5+ and its CSS** (peer dependency).
9. `gbifChecklistKey` - (Optional) When set, the distribution map adds a GBIF occurrence overlay (iNaturalist.poly hex bins) for the focal taxon, using the GBIF v2 multitaxonomy tile endpoint. The value is passed as the `checklistKey` query parameter; the focal taxon's id is passed as `taxonKey`. **The consumer is responsible for only setting this when the configured `datasetKey` actually uses identifiers that GBIF recognises under the given checklist.** For datasets keyed by COL identifiers, use the Catalogue of Life backbone UUID:

    ```
    gbifChecklistKey="7ddf754f-d193-4cc9-b351-99906754a03b"
    ```

To use the map, include MapLibre GL JS alongside React in your page:

```html
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css" />
<script src="https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js"></script>
```

ES module consumers: `npm install maplibre-gl` and `import "maplibre-gl/dist/maplibre-gl.css"` in your bundle entry.

```html
<div id="taxon"></div> <!- Dom element for the taxon details to attach to -->
............
<script >
'use strict';
const e = React.createElement;
class Taxon extends React.Component {

    render() {

      return e(
        ColBrowser.Taxon,
        { datasetKey: 9999,
          pathToTree: '/mytaxonomy/browse',
          pathToSearch= '/data/search',
          pathToDataset: '/sourcedatasets/',
          pathToTaxon: '/mytaxonomy/taxon/', 
          pageTitleTemplate: 'COL | __taxon__',
          showDistributionMap: true,
          gbifChecklistKey: '7ddf754f-d193-4cc9-b351-99906754a03b'
        }
      );
    }
  }

const domContainer = document.querySelector('#taxon');
ReactDOM.createRoot(domContainer).render(e(Taxon));
</script>
```

### ColBrowser.Dataset

[Dataset detail page](https://www.catalogueoflife.org/data/dataset/2073), takes two properties:

1. `datasetKey` - the dataset key from the [Catalogue of Life ChecklistBank](https://www.checklistbank.org/)
2. `pathToTree` - The local path to the tree browser page of your website (for links in the taxonomic coverage section to point towards).
3. `pathToSearch` - The local path to the search page of your website (for links in the metrics section to point towards).
4. `pageTitleTemplate` - A template for formatting the page title. It should be a string containg the variable `__dataset__` that will be replaced with the dataset title name.

```html
<div id="dataset"></div> <!- Dom element for the dataset details to attach to -->
............
<script >
'use strict';
const e = React.createElement;
class Dataset extends React.Component {

    render() {

      return e(
        ColBrowser.Taxon,
        { datasetKey: 9999,
          pathToTree: '/mytaxonomy/browse'
          pathToSearch: '/data/search'
          pageTitleTemplate: 'COL | __dataset__' }
      );
    }
  }

const domContainer = document.querySelector('#dataset');
ReactDOM.createRoot(domContainer).render(e(Dataset));
</script>
```

### ColBrowser.BibTex

Shows source dataset details — a small icon that links to the BibTex citation
for a dataset on [ChecklistBank](https://www.checklistbank.org/). Properties:

1. `datasetKey` - the dataset key from the [Catalogue of Life ChecklistBank](https://www.checklistbank.org/). When `sourceDatasetKey` is also given, this is the catalogue/project containing it; otherwise it's the dataset being cited directly.
2. `sourceDatasetKey` - (Optional) the source dataset to cite within the catalogue identified by `datasetKey`. Use this when the citation is for a source compiled into a larger dataset such as the Catalogue of Life.
3. `style` - To set margins, height etc. Defaults to `{height: "40px"}`.


```html
<div id="bibtex"></div> <!- Dom element for the BibTex to attach to -->
............
<script >
'use strict';
const e = React.createElement;
class BibTex extends React.Component {

    render() {

      // Cite a standalone dataset
      return e(
        ColBrowser.BibTex,
        { datasetKey: 9999 }
      );

      // Or cite a source within a catalogue:
      // return e(
      //   ColBrowser.BibTex,
      //   { datasetKey: 9837, sourceDatasetKey: 1010 }
      // );
    }
  }

const domContainer = document.querySelector('#bibtex');
ReactDOM.createRoot(domContainer).render(e(BibTex));
</script>
```

### Releasing

After a tagged release, purge the floating jsDelivr URLs at <https://www.jsdelivr.com/tools/purge> so embedders pick up the new build within minutes instead of waiting out the ~12 h edge cache:

```
# v2.x release — purge @2 and @latest
https://cdn.jsdelivr.net/gh/CatalogueOfLife/portal-components@2/umd/col-browser.min.js
https://cdn.jsdelivr.net/gh/CatalogueOfLife/portal-components@2/umd/main.css
https://cdn.jsdelivr.net/gh/CatalogueOfLife/portal-components@latest/umd/col-browser.min.js
https://cdn.jsdelivr.net/gh/CatalogueOfLife/portal-components@latest/umd/main.css

# v1.x backport — purge @1 only (do NOT purge @latest)
https://cdn.jsdelivr.net/gh/CatalogueOfLife/portal-components@1/umd/col-browser.min.js
https://cdn.jsdelivr.net/gh/CatalogueOfLife/portal-components@1/umd/main.css
```
