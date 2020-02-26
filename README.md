# Dynamic components for Taxon browse and search

This is a small React Component library consisting of

1. Tree browser
2. Taxon search page, table view
3. Taxon page


## Usage
These components can be included in any html page.
Include dependencies, React and React Dom:

````
<script src="https://unpkg.com/react@16/umd/react.production.min.js" crossorigin></script>
<script src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js" crossorigin></script>
````

Include the Library:

````
<script src="https://cdn.jsdelivr.net/gh/sp2000/colplus-portal-components@0.1/umd/col-tree-browser.min.js" crossorigin></script>
````

And the styles:

````
 <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/sp2000/colplus-portal-components@0.1/umd/main.css">
 ````

This will create a global `ColBrowser` library variable that has three indvidual components:


### ColBrowser.Tree
A [browsable taxonomic tree](https://col-website-demo.netlify.com/data/browse), takes two properties: 
1. `catalogueKey` - the dataset key from the [Catalogue of Life clearinghouse](https://data.catalogue.life/) 
2. `pathToTaxon` - The local path to the taxon page of your website (for links in the taxon tree to point towards).

````
<div id="tree"></div> <!- Dom element for the tree to attach to -->
............
<script >
'use strict';
const e = React.createElement;
class Tree extends React.Component {

    render() {
       
      return e(
        ColBrowser.Tree,
        { catalogueKey: 9999 , pathToTaxon: '/mytaxonomy/taxon/' }
      );
    }
  }

const domContainer = document.querySelector('#tree');
ReactDOM.render(e(Tree), domContainer);
</script>
````
### ColBrowser.Search
[Search component with table view](https://col-website-demo.netlify.com/data/search), takes two properties: 
1. `catalogueKey` - the dataset key from the [Catalogue of Life clearinghouse](https://data.catalogue.life/)  
2. `pathToTaxon` - The local path to the taxon page of your website (for links in the taxon tree to point towards).

````
<div id="search"></div> <!- Dom element for the search to attach to -->
............
<script >
'use strict';
const e = React.createElement;
class Search extends React.Component {

    render() {
       
      return e(
        ColBrowser.Search,
        { catalogueKey: 9999 , pathToTaxon: '/mytaxonomy/taxon/' }
      );
    }
  }

const domContainer = document.querySelector('#search');
ReactDOM.render(e(Search), domContainer);
</script>
````

### ColBrowser.Taxon
[Taxon detail page](https://col-website-demo.netlify.com/data/taxon/41117128-65e0-428c-a293-f34ddc16da32), takes two properties: 
1. `catalogueKey` - the dataset key from the [Catalogue of Life clearinghouse](https://data.catalogue.life/)  
2. `pathToTree` - The local path to the tree browser page of your website (for links in the taxon classification to point towards).

````
<div id="taxon"></div> <!- Dom element for the taxon details to attach to -->
............
<script >
'use strict';
const e = React.createElement;
class Taxon extends React.Component {

    render() {
       
      return e(
        ColBrowser.Taxon,
        { catalogueKey: 9999 , pathToTree: '/mytaxonomy/browse' }
      );
    }
  }

const domContainer = document.querySelector('#taxon');
ReactDOM.render(e(Taxon), domContainer);
</script>
````
