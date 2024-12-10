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


## Usage

These components can be included in any html page.
Include dependencies, React and React Dom:

```
<script src="https://unpkg.com/react@16/umd/react.production.min.js" ></script>
<script src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js" ></script>
```

Include the Library - current version can be found [here](https://github.com/CatalogueOfLife/portal-components/releases/latest).
We recommend to always use the @latest version:

```
<script src="https://cdn.jsdelivr.net/gh/CatalogueOfLife/portal-components@latest/umd/col-browser.min.js" ></script>
```

And the styles:

```
 <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/CatalogueOfLife/portal-components@latest/umd/main.css">
```


This will create a global `ColBrowser` library variable that has four indvidual components:

### ColBrowser.Tree

A [browsable taxonomic tree](https://www.catalogueoflife.org/data/browse), takes three properties:

1. `catalogueKey` - the dataset key from the [Catalogue of Life ChecklistBank](https://www.checklistbank.org/)
2. `pathToTaxon` - The local path to the taxon page of your website (for links in the taxon tree to point towards). Alternatively, you can provide a callback function taking the taxonID as parameter as seen in [this example](https://github.com/CatalogueOfLife/portal-components/issues/27#issuecomment-1144524981).
3. `defaultTaxonKey` - (Optional) Initially expand the tree down to this taxon.
4. `pathToDataset` - (Optional, only relevant for datasets compiled from other source datasets) The local path to the source dataset page of your website (for links in the taxon tree to point towards).
5. `showTreeOptions` - (Optional) show toggles for extinct taxa and info (estimates, providers etc)
6. `linkToSpeciesPage`- (Optional) when the searchbox finds a species or infraspecific taxon, jump directly to the taxon page rather than opening the tree 
7. `citation` - (Optional) either "top" or "bottom" include the neccessary dataset citation above or below the tree component
8. `type` - (Optional) e.g. `type="project"` this will show info about contributing sources on the tree nodes

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

[Search component with table view](https://www.catalogueoflife.org/data/search), takes two properties:

1. `catalogueKey` - the dataset key from the [Catalogue of Life ChecklistBank](https://www.checklistbank.org/)
2. `pathToTaxon` - The local path to the taxon page of your website (for links in the taxon tree to point towards).  Alternatively, you can provide a callback function taking the taxonID as parameter as seen in [this example](https://github.com/CatalogueOfLife/portal-components/issues/27#issuecomment-1144524981).
3. `defaultTaxonKey` - (Optional) if the search should default to a certain Family, Order etc
4. `citation` - (Optional) either "top" or "bottom" include the neccessary dataset citation above or below the search component

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

[Taxon detail page](https://www.catalogueoflife.org/data/taxon/623QT), takes three properties:

1. `catalogueKey` - the dataset key from the [Catalogue of Life ChecklistBank](https://www.checklistbank.org/)
2. `pathToTree` - The local path to the tree browser page of your website (for links in the taxon classification to point towards).
3. `pathToSearch` - The local path to the search page of your website (for links in the classification to point towards).
4. `pathToDataset` - (Optional, only relevant for datasets compiled from other source datasets) The local path to the source dataset page of your website (for links in the taxon tree to point towards).
5. `pathToTaxon=` - The local path to the taxon page of your website (the page where this component will placed).
6. `pageTitleTemplate` - A template for formatting the page title. It should be a string containg the variable `__taxon__` that will be replaced with the taxon name.
7. `identifierLabel` - Label for the identifier listed on top of the taxon view. Defaults to `Identifier`

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
          pathToSearch= '/data/search',
          pathToDataset: '/sourcedatasets/',
          pathToTaxon: '/mytaxonomy/taxon/' 
          pageTitleTemplate: 'COL | __taxon__'}
      );
    }
  }

const domContainer = document.querySelector('#taxon');
ReactDOM.render(e(Taxon), domContainer);
</script>
```

### ColBrowser.Dataset

[Dataset detail page](https://www.catalogueoflife.org/data/dataset/2073), takes two properties:

1. `catalogueKey` - the dataset key from the [Catalogue of Life ChecklistBank](https://www.checklistbank.org/)
2. `pathToTree` - The local path to the tree browser page of your website (for links in the taxonomic coverage section to point towards).
3. `pathToSearch` - The local path to the search page of your website (for links in the metrics section to point towards).
4. `pageTitleTemplate` - A template for formatting the page title. It should be a string containg the variable `__dataset__` that will be replaced with the dataset title name.

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
          pathToTree: '/mytaxonomy/browse'
          pathToSearch: '/data/search'
          pageTitleTemplate: 'COL | __dataset__' }
      );
    }
  }

const domContainer = document.querySelector('#dataset');
ReactDOM.render(e(Dataset), domContainer);
</script>
```

### ColBrowser.BibTex

[Dataset detail page](https://www.catalogueoflife.org/data/dataset/2073), takes two properties:

1. `datasetKey` - the dataset key from the [Catalogue of Life ChecklistBank](https://www.checklistbank.org/)
2. `catalogueKey` - Optional, cite as source in a compiled dataset such the Catalogue of Life.
3. `style` - To set margins, height etc. Defaults to {height: "40px"}.


```
<div id="bibtex"></div> <!- Dom element for the BibTex to attach to -->
............
<script >
'use strict';
const e = React.createElement;
class BibTex extends React.Component {

    render() {

      return e(
        ColBrowser.BibTex,
        { datasetKey: 9999 }
      );
    }
  }

const domContainer = document.querySelector('#bibtex');
ReactDOM.render(e(BibTex), domContainer);
</script>
```

###
After doing a versioned release, remember to purge the cache here https://www.jsdelivr.com/tools/purge
for these two urls:
```
https://cdn.jsdelivr.net/gh/CatalogueOfLife/portal-components@latest/umd/col-browser.min.js
https://cdn.jsdelivr.net/gh/CatalogueOfLife/portal-components@latest/umd/main.css
```
