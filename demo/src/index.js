import React, { Component } from "react";
import { render } from "react-dom";

import { Tree, Taxon, Search, Dataset, DatasetSearch, BibTex, TaxonBreakdown } from "../../src";

import config from "../../src/config";
import history from "../../src/history";

const environments = {
  production: "https://api.checklistbank.org/",
  development: "https://api.dev.checklistbank.org/",
};

const routes = [
  { path: "/data/tree", label: "Tree" },
  { path: "/data/search", label: "Search" },
  { path: "/data/taxon/622TP", label: "Taxon" },
  { path: "/data/source/1010", label: "Dataset" },
  { path: "/data/contributors", label: "DatasetSearch" },
  { path: "/data/bibtex", label: "BibTex" },
  { path: "/data/breakdown", label: "TaxonBreakdown" },
];

class Demo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pathname: history.location.pathname,
      env: "production",
      datasetKey: "3LR",
      datasetKeyInput: "3LR",
    };
    this.unlisten = history.listen((location) => {
      this.setState({ pathname: location.pathname });
    });
  }

  componentWillUnmount() {
    this.unlisten();
  }

  switchEnv = (e) => {
    const env = e.target.value;
    config.dataApi = environments[env];
    this.remount();
    this.setState({ env });
  };

  applyDatasetKey = (e) => {
    e.preventDefault();
    this.setState({ datasetKey: this.state.datasetKeyInput }, () => this.remount());
  };

  remount() {
    const current = history.location.pathname;
    history.replace("/");
    setTimeout(() => history.replace(current), 0);
  }

  render() {
    const { pathname, env, datasetKey } = this.state;
    const isHome = pathname === "/";

    return (
      <div style={{ background: "#f2f3ed", minHeight: "100%" }}>
        <nav style={{ padding: "16px", borderBottom: "1px solid #ccc", marginBottom: "16px", fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", alignItems: "center" }}>
          <a href="/" style={{ fontWeight: "bold", marginRight: "24px" }}>col-browser Demo</a>
          {routes.map((r) => (
            <a
              key={r.path}
              href={r.path}
              onClick={(e) => { e.preventDefault(); history.push(r.path); }}
              style={{
                marginRight: "16px",
                fontWeight: pathname.indexOf(r.path) === 0 ? "bold" : "normal",
              }}
            >
              {r.label}
            </a>
          ))}
          <form onSubmit={this.applyDatasetKey} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
            <label>Dataset:
              <input
                value={this.state.datasetKeyInput}
                onChange={(e) => this.setState({ datasetKeyInput: e.target.value })}
                style={{ marginLeft: "4px", width: "80px", padding: "4px 8px", fontFamily: "inherit" }}
              />
            </label>
            <select
              value={env}
              onChange={this.switchEnv}
              style={{ padding: "4px 8px", fontFamily: "inherit" }}
            >
              <option value="production">Production API</option>
              <option value="development">Development API</option>
            </select>
          </form>
        </nav>

        {isHome && (
          <div style={{ padding: "16px" }}>
            <h2>Components</h2>
            <ul>
              {routes.map((r) => (
                <li key={r.path} style={{ margin: "8px 0" }}>
                  <a href={r.path} onClick={(e) => { e.preventDefault(); history.push(r.path); }}>
                    {r.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {pathname === "/data/tree" && (
          <Tree
            showTreeOptions={true}
            catalogueKey={datasetKey}
            pathToTaxon="/data/taxon/"
            pathToDataset="/data/source/"
            citation="bottom"
            type="project"
          />
        )}
        {pathname.indexOf("/data/taxon/") === 0 && (
          <Taxon
            catalogueKey={datasetKey}
            pathToTree="/data/tree"
            pathToSearch="/data/search"
            pathToDataset="/data/source/"
            pathToTaxon="/data/taxon/"
            pageTitleTemplate="COL | __taxon__"
            identifierLabel="COL identifier"
          />
        )}
        {pathname.indexOf("/data/search") === 0 && (
          <Search
            catalogueKey={datasetKey}
            pathToTaxon="/data/taxon/"
            citation="bottom"
          />
        )}
        {pathname.indexOf("/data/source") === 0 && (
          <Dataset
            catalogueKey={datasetKey}
            pathToTree="/data/tree"
            pathToSearch="/data/search"
            pageTitleTemplate="COL | __dataset__"
          />
        )}
        {pathname.indexOf("/data/contributors") === 0 && (
          <DatasetSearch
            catalogueKey={datasetKey}
            pathToDataset="/data/source/"
            pathToSearch="/data/search"
          />
        )}
        {pathname.indexOf("/data/bibtex") === 0 && (
          <BibTex datasetKey={datasetKey} />
        )}
        {pathname.indexOf("/data/breakdown") === 0 && (
          <TaxonBreakdown datasetKey={datasetKey} pathToTaxon="/data/taxon/" taxonId={"V"} />
        )}
      </div>
    );
  }
}

render(<Demo />, document.querySelector("#demo"));
