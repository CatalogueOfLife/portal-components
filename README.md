# Dynamic components for Taxon browse and search

This is a small React Component library consisting of

1. Tree browser
2. Taxon search page, table view
3. Taxon page
4. Dataset page (Relevant for projects compiled from several source datasets providing taxonomic 'sectors' i.e. subtrees)

## Usage

These components can be included in any html page.
Include dependencies, React and React Dom:

```
<script src="https://unpkg.com/react@16/umd/react.production.min.js" ></script>
<script src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js" ></script>
```

Include the Library:

```
<script src="https://cdn.jsdelivr.net/gh/CatalogueOfLife/portal-components@0.4.6/umd/col-browser.min.js" ></script>
```

or get the latest version available:

```
<script src="https://cdn.jsdelivr.net/gh/CatalogueOfLife/portal-components/umd/col-browser.min.js" ></script>
```

And the styles:

```
 <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/CatalogueOfLife/portal-components@0.4.6/umd/main.css">
```

or get the the latest version available:

```
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/CatalogueOfLife/portal-components/umd/main.css">
```

This will create a global `ColBrowser` library variable that has four indvidual components:

### ColBrowser.Tree

A [browsable taxonomic tree](https://www.dev.catalogue.life/data/browse.html), takes three properties:

1. `catalogueKey` - the dataset key from the [Catalogue of Life clearinghouse](https://data.catalogue.life/)
2. `pathToTaxon` - The local path to the taxon page of your website (for links in the taxon tree to point towards).
3. `defaultTaxonKey` - (Optional) Initially expand the tree down to this taxon.
4. `pathToDataset` - (Optional, only relevant for datasets compiled from other source datasets) The local path to the source dataset page of your website (for links in the taxon tree to point towards).
5. `showTreeOptions` - (Optional) show toggles for extinct taxa and info (estimates, providers etc)

```
<div id="tree"></div> <!- Dom element for the tree to attach to -->
............
<script >
'use strict';
const e = React.createElement;
class Tree extends React.Component {

    render() {

      return e(
        ColBrowser.Tree,
        { catalogueKey: 9999,
          pathToTaxon: '/mytaxonomy/taxon/',
          defaultTaxonKey: 'urn:lsid:indexfungorum.org:names:814401',
          pathToDataset: '/sourcedatasets/' }
      );
    }
  }

const domContainer = document.querySelector('#tree');
ReactDOM.render(e(Tree), domContainer);
</script>
```

### ColBrowser.Search

[Search component with table view](https://www.dev.catalogue.life/data/search.html), takes two properties:

1. `catalogueKey` - the dataset key from the [Catalogue of Life clearinghouse](https://data.catalogue.life/)
2. `pathToTaxon` - The local path to the taxon page of your website (for links in the taxon tree to point towards).

```
<div id="search"></div> <!- Dom element for the search to attach to -->
............
<script >
'use strict';
const e = React.createElement;
class Search extends React.Component {

    render() {

      return e(
        ColBrowser.Search,
        { catalogueKey: 9999,
          pathToTaxon: '/mytaxonomy/taxon/' }
      );
    }
  }

const domContainer = document.querySelector('#search');
ReactDOM.render(e(Search), domContainer);
</script>
```

### ColBrowser.Taxon

[Taxon detail page](https://www.dev.catalogue.life/data/taxon/1981d777-6127-4ca5-b960-078fe254caef), takes three properties:

1. `catalogueKey` - the dataset key from the [Catalogue of Life clearinghouse](https://data.catalogue.life/)
2. `pathToTree` - The local path to the tree browser page of your website (for links in the taxon classification to point towards).
3. `pathToDataset` - (Optional, only relevant for datasets compiled from other source datasets) The local path to the source dataset page of your website (for links in the taxon tree to point towards).
4. `pathToTaxon=` - The local path to the taxon page of your website (the page where this component will placed).

```
<div id="taxon"></div> <!- Dom element for the taxon details to attach to -->
............
<script >
'use strict';
const e = React.createElement;
class Taxon extends React.Component {

    render() {

      return e(
        ColBrowser.Taxon,
        { catalogueKey: 9999,
          pathToTree: '/mytaxonomy/browse',
          pathToDataset: '/sourcedatasets/',
          pathToTaxon: '/mytaxonomy/taxon/' }
      );
    }
  }

const domContainer = document.querySelector('#taxon');
ReactDOM.render(e(Taxon), domContainer);
</script>
```

### ColBrowser.Dataset

[Dataset detail page](https://www.dev.catalogue.life/data/dataset/2073), takes two properties:

1. `catalogueKey` - the dataset key from the [Catalogue of Life clearinghouse](https://data.catalogue.life/)
2. `pathToTree` - The local path to the tree browser page of your website (for links in the taxonomic coverage section to point towards).

```
<div id="dataset"></div> <!- Dom element for the dataset details to attach to -->
............
<script >
'use strict';
const e = React.createElement;
class Dataset extends React.Component {

    render() {

      return e(
        ColBrowser.Taxon,
        { catalogueKey: 9999,
          pathToTree: '/mytaxonomy/browse' }
      );
    }
  }

const domContainer = document.querySelector('#dataset');
ReactDOM.render(e(Dataset), domContainer);
</script>
```
