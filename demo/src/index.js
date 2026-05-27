import { Component } from "react";
import { createRoot } from "react-dom/client";
import "maplibre-gl/dist/maplibre-gl.css";

import { Tree, Taxon, Search, SourceDataset, SourceDatasetList, BibTex, TaxonBreakdown, TaxonDistribution } from "../../src";
import { ESTABLISHMENT_MEANS, MISSING_COLOR } from "../../src/Taxon/DistributionsMap";

import config from "../../src/config";

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
  { path: "/data/distribution", label: "TaxonDistribution" },
];

// Demo uses hash-based routing so it can be hosted on GitHub Pages without
// SPA fallback config. Real pathname/query writes from the library (e.g.
// `?taxonKey=…`) still happen and survive refresh; the demo just doesn't
// care about them for which-view-to-render.
const parseRoute = () => {
  const raw = window.location.hash || "";
  return raw.startsWith("#") ? raw.slice(1) : raw;
};

class Demo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      route: parseRoute() || "/",
      env: "production",
      datasetKey: "3LR",
      datasetKeyInput: "3LR",
    };
    this._onHash = () => this.setState({ route: parseRoute() || "/" });
    window.addEventListener("hashchange", this._onHash);
  }

  componentWillUnmount() {
    window.removeEventListener("hashchange", this._onHash);
  }

  navigate = (path) => {
    window.location.hash = path;
  };

  switchEnv = (e) => {
    const env = e.target.value;
    config.dataApi = environments[env];
    this.setState({ env });
  };

  applyDatasetKey = (e) => {
    e.preventDefault();
    this.setState({ datasetKey: this.state.datasetKeyInput });
  };

  render() {
    const { route, env, datasetKey } = this.state;
    const isHome = route === "/" || route === "";

    // Bumping the key whenever env / datasetKey changes is enough to force
    // each library component to fully remount with the new config — replaces
    // the previous history.replace round-trip.
    const mountKey = `${env}-${datasetKey}`;

    const linkStyle = (active) => ({
      marginRight: "16px",
      fontWeight: active ? "bold" : "normal",
    });

    return (
      <div style={{ background: "#f2f3ed", minHeight: "100%" }}>
        <nav style={{ padding: "16px", borderBottom: "1px solid #ccc", marginBottom: "16px", fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", alignItems: "center" }}>
          <a href="#/" style={{ fontWeight: "bold", marginRight: "24px" }}>col-browser Demo</a>
          {routes.map((r) => (
            <a
              key={r.path}
              href={`#${r.path}`}
              style={linkStyle(route.indexOf(r.path) === 0)}
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
                  <a href={`#${r.path}`}>{r.label}</a>
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

        {route === "/data/tree" && (
          <Tree
            key={mountKey}
            showTreeOptions={true}
            datasetKey={datasetKey}
            pathToTaxon="#/data/taxon/"
            pathToDataset="#/data/source/"
            citation="bottom"
            type="project"
          />
        )}
        {route.indexOf("/data/taxon/") === 0 && (
          <Taxon
            key={mountKey + "-" + route}
            datasetKey={datasetKey}
            pathToTree="#/data/tree"
            pathToSearch="#/data/search"
            pathToDataset="#/data/source/"
            pathToTaxon="#/data/taxon/"
            pageTitleTemplate="COL | __taxon__"
            identifierLabel="COL identifier"
            showDistributionMap
            gbifChecklistKey="7ddf754f-d193-4cc9-b351-99906754a03b"
          />
        )}
        {route.indexOf("/data/search") === 0 && (
          <Search
            key={mountKey}
            datasetKey={datasetKey}
            pathToTaxon="#/data/taxon/"
            citation="bottom"
          />
        )}
        {route.indexOf("/data/source") === 0 && (
          <SourceDataset
            key={mountKey + "-" + route}
            datasetKey={datasetKey}
            pathToTree="#/data/tree"
            pathToSearch="#/data/search"
            pageTitleTemplate="COL | __dataset__"
          />
        )}
        {route.indexOf("/data/contributors") === 0 && (
          <SourceDatasetList
            key={mountKey}
            datasetKey={datasetKey}
            pathToDataset="#/data/source/"
            pathToSearch="#/data/search"
          />
        )}
        {route.indexOf("/data/bibtex") === 0 && (
          <BibTex key={mountKey} datasetKey={datasetKey} />
        )}
        {route.indexOf("/data/breakdown") === 0 && (
          <TaxonBreakdown key={mountKey} datasetKey={datasetKey} pathToTaxon="#/data/taxon/" taxonId={"ST"} level={2} />
        )}
        {route.indexOf("/data/distribution") === 0 && (
          <TaxonDistribution
            key={mountKey}
            datasetKey={datasetKey}
            taxonId={"6W3C4"}
            pathToDataset="#/data/source/"
            gbifChecklistKey="7ddf754f-d193-4cc9-b351-99906754a03b"
          />
        )}
      </div>
    );
  }
}

createRoot(document.querySelector("#demo")).render(<Demo />);
