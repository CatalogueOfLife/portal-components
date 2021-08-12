import React, { Component } from "react";
import { render } from "react-dom";

// const ColTree =  require('../../src/index.js').ColTree

// const Taxon =  require('../../src/index.js').Taxon

import { Tree, Taxon, Search, Dataset, DatasetSearch, BibTex } from "../../src";

import history from "../../src/history";


class Demo extends Component {
  render() {
    const { location: path } = history;
    return (
      <div style={{ background: "#f2f3ed", height: '100%'
    }}>
        <h1>col-tree-browser Demo</h1>

        <React.Fragment>
          {path.pathname === "/data/tree" && (
            <Tree
              showTreeOptions={true}
              catalogueKey={"2328"}
              pathToTaxon="/data/taxon/"
              pathToDataset="/data/source/"
              citation="bottom"
            />
          )}
          {path.pathname.indexOf("/data/taxon/") === 0 && (
            <Taxon
              catalogueKey={"2328"}
              pathToTree="/data/tree"
              pathToSearch="/data/search"
              pathToDataset="/data/source/"
              pathToTaxon="/data/taxon/"
              pageTitleTemplate="COL | __taxon__"
            ></Taxon>
          )}
          {path.pathname.indexOf("/data/search") === 0 && (
            <Search catalogueKey={"2328"}  pathToTaxon="/data/taxon/" citation="bottom"></Search>
          )}
          {path.pathname.indexOf("/data/source") === 0 && (
            <Dataset 
              catalogueKey={"2328"} 
              pathToTree="/data/tree" 
              pathToSearch="/data/search"
              pageTitleTemplate="COL | __dataset__"
              >

              </Dataset>
          )}
          {path.pathname.indexOf("/data/contributors") === 0 && (
            <DatasetSearch
              catalogueKey={"2328"}
              pathToDataset="/data/source/"
              pathToSearch="/data/search"
            ></DatasetSearch>
          )}

          {path.pathname.indexOf("/data/bibtex") === 0 && (
            <BibTex
              datasetKey={"2328"}
            ></BibTex>
          )}
        </React.Fragment>
      </div>
    );
  }
}

render(<Demo />, document.querySelector("#demo"));
