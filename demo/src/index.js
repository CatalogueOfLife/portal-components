import React, { Component } from "react";
import { render } from "react-dom";

// const ColTree =  require('../../src/index.js').ColTree

// const Taxon =  require('../../src/index.js').Taxon

import { Tree, Taxon, Search, Dataset, DatasetSearch, BibTex } from "../../src";

import history from "../../src/history";

// Test function that could be given to the tree as "pathToTaxon" instead of a string
var callBack = function (taxonKey) {
  alert(`This seems to work, key is ${taxonKey}`);
  window.location.href = `/data/taxon/${taxonKey}`;
};

class Demo extends Component {
  render() {
    const { location: path } = history;
    return (
      <div style={{ background: "#f2f3ed", height: "100%" }}>
        <h1>col-tree-browser Demo</h1>

        <React.Fragment>
          {path.pathname === "/data/tree" && (
            <Tree
              showTreeOptions={true}
              catalogueKey={"3LR"}
              pathToTaxon="/data/taxon/"
              pathToDataset="/data/source/"
              citation="bottom"
            />
          )}
          {path.pathname.indexOf("/data/taxon/") === 0 && (
            <Taxon
              catalogueKey={"3LR"}
              pathToTree="/data/tree"
              pathToSearch="/data/search"
              pathToDataset="/data/source/"
              pathToTaxon="/data/taxon/"
              pageTitleTemplate="COL | __taxon__"
              identifierLabel="COL identifier"
            ></Taxon>
          )}
          {path.pathname.indexOf("/data/search") === 0 && (
            <Search
              catalogueKey={"3LR"}
              pathToTaxon="/data/taxon/"
              citation="bottom"
            ></Search>
          )}
          {path.pathname.indexOf("/data/source") === 0 && (
            <Dataset
              catalogueKey={"3LR"}
              pathToTree="/data/tree"
              pathToSearch="/data/search"
              pageTitleTemplate="COL | __dataset__"
            ></Dataset>
          )}
          {path.pathname.indexOf("/data/contributors") === 0 && (
            <DatasetSearch
              catalogueKey={"3LR"}
              pathToDataset="/data/source/"
              pathToSearch="/data/search"
            ></DatasetSearch>
          )}

          {path.pathname.indexOf("/data/bibtex") === 0 && (
            <BibTex datasetKey={"3LR"}></BibTex>
          )}
        </React.Fragment>
      </div>
    );
  }
}

render(<Demo />, document.querySelector("#demo"));
