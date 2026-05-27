import { Component } from "react";
import { createRoot } from "react-dom/client";
import "maplibre-gl/dist/maplibre-gl.css";

import { Tree, Taxon, Search, SourceDataset, SourceDatasetList, BibTex, TaxonBreakdown } from "../../src";
import { ESTABLISHMENT_MEANS, MISSING_COLOR } from "../../src/Taxon/DistributionsMap";

import config from "../../src/config";
import history from "../../src/history";

const environments = {
  production: "https://api.checklistbank.org/",
  development: "https://api.dev.checklistbank.org/",
};

const routes = [
  { path: "/data/tree", label: "Tree" },
  { path: "/data/search", label: "Search" },
  { path: "/data/taxon/6W3C4", label: "Taxon" },
  { path: "/data/source/1010", label: "SourceDataset" },
  { path: "/data/contributors", label: "SourceDatasetList" },
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
    this.unlisten = history.listen(({ location }) => {
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
            <h2>Distribution map legend</h2>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              {[
                ...ESTABLISHMENT_MEANS,
                { key: "__missing__", label: "(no establishmentMeans — not shown in map legend)", color: MISSING_COLOR },
              ].map((m) => (
                <div
                  key={m.key}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 16,
                      height: 16,
                      background: m.color,
                      border: "1px solid rgba(0,0,0,0.15)",
                      borderRadius: 2,
                    }}
                  />
                  <span style={{ fontFamily: "monospace" }}>{m.color}</span>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {pathname === "/data/tree" && (
          <Tree
            showTreeOptions={true}
            datasetKey={datasetKey}
            pathToTaxon="/data/taxon/"
            pathToDataset="/data/source/"
            citation="bottom"
            type="project"
          />
        )}
        {pathname.indexOf("/data/taxon/") === 0 && (
          <Taxon
            datasetKey={datasetKey}
            pathToTree="/data/tree"
            pathToSearch="/data/search"
            pathToDataset="/data/source/"
            pathToTaxon="/data/taxon/"
            pageTitleTemplate="COL | __taxon__"
            identifierLabel="COL identifier"
            showDistributionMap
            gbifChecklistKey="7ddf754f-d193-4cc9-b351-99906754a03b"
          />
        )}
        {pathname.indexOf("/data/search") === 0 && (
          <Search
            datasetKey={datasetKey}
            pathToTaxon="/data/taxon/"
            citation="bottom"
          />
        )}
        {pathname.indexOf("/data/source") === 0 && (
          <SourceDataset
            datasetKey={datasetKey}
            pathToTree="/data/tree"
            pathToSearch="/data/search"
            pageTitleTemplate="COL | __dataset__"
          />
        )}
        {pathname.indexOf("/data/contributors") === 0 && (
          <SourceDatasetList
            datasetKey={datasetKey}
            pathToDataset="/data/source/"
            pathToSearch="/data/search"
          />
        )}
        {pathname.indexOf("/data/bibtex") === 0 && (
          <BibTex datasetKey={datasetKey} />
        )}
        {pathname.indexOf("/data/breakdown") === 0 && (
          <TaxonBreakdown datasetKey={datasetKey} pathToTaxon="/data/taxon/" taxonId={"ST"} level={2} />
        )}
      </div>
    );
  }
}

createRoot(document.querySelector("#demo")).render(<Demo />);
