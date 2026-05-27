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

    const sans = "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

    const navLinkStyle = (active) => ({
      padding: "6px 12px",
      borderRadius: "8px",
      fontSize: "13px",
      fontWeight: 500,
      letterSpacing: "0.01em",
      color: active ? "#fff" : "#444",
      background: active ? "#111" : "transparent",
      textDecoration: "none",
      transition: "background 0.15s, color 0.15s",
    });

    const inputStyle = {
      padding: "6px 10px",
      border: "1px solid #d4d4d8",
      borderRadius: "8px",
      fontFamily: sans,
      fontSize: "13px",
      background: "#fff",
      outline: "none",
    };

    return (
      <div style={{ background: "#fff", minHeight: "100%", fontFamily: sans, color: "#222" }}>
        <style>{`
          a.col-demo-navlink:hover {
            background: #f3f4f6;
            color: #111;
          }
          a.col-demo-navlink.is-active:hover {
            background: #111;
            color: #fff;
          }
          .col-demo-brand:hover { color: #111; }
        `}</style>
        <nav style={{
          padding: "12px 20px",
          borderBottom: "1px solid #e5e7eb",
          marginBottom: "16px",
          fontFamily: sans,
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}>
          <a
            href="#/"
            className="col-demo-brand"
            style={{
              fontWeight: 700,
              fontSize: "14px",
              letterSpacing: "-0.01em",
              marginRight: "24px",
              color: "#111",
              textDecoration: "none",
            }}
          >
            col-browser
          </a>
          {routes.map((r) => {
            const active = route.indexOf(r.path) === 0;
            return (
              <a
                key={r.path}
                href={`#${r.path}`}
                className={`col-demo-navlink${active ? " is-active" : ""}`}
                style={navLinkStyle(active)}
              >
                {r.label}
              </a>
            );
          })}
          <form
            onSubmit={this.applyDatasetKey}
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#666", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Dataset
              <input
                value={this.state.datasetKeyInput}
                onChange={(e) => this.setState({ datasetKeyInput: e.target.value })}
                style={{ ...inputStyle, width: "80px", textTransform: "none", letterSpacing: 0, color: "#222" }}
              />
            </label>
            <select
              value={env}
              onChange={this.switchEnv}
              style={inputStyle}
            >
              <option value="production">Production</option>
              <option value="development">Development</option>
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
