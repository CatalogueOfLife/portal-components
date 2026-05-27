import { Component } from "react";
import { createRoot } from "react-dom/client";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  Tree,
  Taxon,
  Search,
  SourceDataset,
  SourceDatasetList,
  BibTex,
  TaxonBreakdown,
  TaxonDistribution,
} from "../../src";
import { withRouting } from "../../src/url";
import { ESTABLISHMENT_MEANS, MISSING_COLOR } from "../../src/Taxon/DistributionsMap";
import config from "../../src/config";

// All hosted on GitHub Pages with hash routing, so the URL adapter speaks
// hash mode. Each top-level component gets its own wrapper that knows the
// route prefix to mount under.
const paths = {
  taxon: "taxon/",
  tree: "tree",
  search: "search",
  source: "source/",
  taxonBreakdown: "breakdown/",
  taxonDistribution: "distribution/",
  bibtex: "bibtex/",
};

const URLTree              = withRouting(Tree,              { kind: "tree",              mode: "hash", paths });
const URLSearch            = withRouting(Search,            { kind: "search",            mode: "hash", paths });
const URLTaxon             = withRouting(Taxon,             { kind: "taxon",             mode: "hash", paths });
const URLTaxonBreakdown    = withRouting(TaxonBreakdown,    { kind: "taxonBreakdown",    mode: "hash", paths });
const URLTaxonDistribution = withRouting(TaxonDistribution, { kind: "taxonDistribution", mode: "hash", paths });
const URLSourceDatasetList = withRouting(SourceDatasetList, { kind: "sourceList",        mode: "hash", paths });
const URLSourceDataset     = withRouting(SourceDataset,     { kind: "source",            mode: "hash", paths });
const URLBibTex            = withRouting(BibTex,            { kind: "bibtex",            mode: "hash", paths });

const environments = {
  production: "https://api.checklistbank.org/",
  development: "https://api.dev.checklistbank.org/",
};

const routes = [
  { path: "tree", label: "Tree" },
  { path: "search", label: "Search" },
  { path: "taxon/6W3C4", label: "Taxon" },
  { path: "breakdown/ST", label: "TaxonBreakdown" },
  { path: "distribution/HWCX", label: "TaxonDistribution" },
  { path: "sources", label: "SourceDatasetList" },
  { path: "source/1010", label: "SourceDataset" },
  { path: "bibtex/1010", label: "BibTex" },
];

const parseRoute = () => {
  const raw = window.location.hash || "";
  return raw.startsWith("#") ? raw.slice(1).split("?")[0] : raw.split("?")[0];
};

class Demo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      route: parseRoute() || "/",
      env: "production",
      datasetKey: "3LXR",
      datasetKeyInput: "3LXR",
    };
    this._onHash = () => this.setState({ route: parseRoute() || "/" });
    window.addEventListener("hashchange", this._onHash);
  }

  componentWillUnmount() {
    window.removeEventListener("hashchange", this._onHash);
  }

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
          a.col-demo-navlink:hover { background: #f3f4f6; color: #111; }
          a.col-demo-navlink.is-active:hover { background: #111; color: #fff; }
          .col-demo-brand:hover { color: #111; }
        `}</style>
        <nav style={{ padding: "12px 20px", borderBottom: "1px solid #e5e7eb", marginBottom: "16px", fontFamily: sans, display: "flex", alignItems: "center", gap: "4px" }}>
          <a href="#/" className="col-demo-brand" style={{ fontWeight: 700, fontSize: "14px", letterSpacing: "-0.01em", marginRight: "24px", color: "#111", textDecoration: "none" }}>
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
          <form onSubmit={this.applyDatasetKey} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#666", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Dataset
              <input
                value={this.state.datasetKeyInput}
                onChange={(e) => this.setState({ datasetKeyInput: e.target.value })}
                style={{ ...inputStyle, width: "80px", textTransform: "none", letterSpacing: 0, color: "#222" }}
              />
            </label>
            <select value={env} onChange={this.switchEnv} style={inputStyle}>
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
          </div>
        )}

        {route === "tree" && (
          <URLTree
            key={mountKey}
            showTreeOptions={true}
            datasetKey={datasetKey}
            citation="bottom"
            type="project"
          />
        )}
        {route.indexOf("taxon/") === 0 && (
          <URLTaxon
            key={mountKey + "-" + route}
            datasetKey={datasetKey}
            pageTitleTemplate="COL | __taxon__"
            identifierLabel="COL identifier"
            showDistributionMap
            gbifChecklistKey="7ddf754f-d193-4cc9-b351-99906754a03b"
          />
        )}
        {route === "search" && (
          <URLSearch key={mountKey} datasetKey={datasetKey} citation="bottom" />
        )}
        {route.indexOf("source/") === 0 && (
          <URLSourceDataset
            key={mountKey + "-" + route}
            datasetKey={datasetKey}
            pageTitleTemplate="COL | __dataset__"
          />
        )}
        {route === "sources" && (
          <URLSourceDatasetList key={mountKey} datasetKey={datasetKey} />
        )}
        {(route === "bibtex" || route.indexOf("bibtex/") === 0) && (
          <URLBibTex key={mountKey + "-" + route} datasetKey={datasetKey} />
        )}
        {(route === "breakdown" || route.indexOf("breakdown/") === 0) && (
          <div>
            <h3 style={{ padding: "0 16px", marginTop: 0 }}>level=1</h3>
            <URLTaxonBreakdown
              key={mountKey + "-l1-" + route}
              datasetKey={datasetKey}
              level={1}
            />
            <h3 style={{ padding: "0 16px", marginTop: "32px" }}>level=2</h3>
            <URLTaxonBreakdown
              key={mountKey + "-l2-" + route}
              datasetKey={datasetKey}
              level={2}
            />
          </div>
        )}
        {(route === "distribution" || route.indexOf("distribution/") === 0) && (
          <>
            <URLTaxonDistribution
              key={mountKey + "-" + route}
              datasetKey={datasetKey}
              gbifChecklistKey="7ddf754f-d193-4cc9-b351-99906754a03b"
            />
            <div style={{ padding: "24px 16px", borderTop: "1px solid #e5e7eb", marginTop: "24px" }}>
              <h3 style={{ marginTop: 0 }}>Distribution map legend</h3>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                {[
                  ...ESTABLISHMENT_MEANS,
                  { key: "__missing__", label: "(no establishmentMeans — not shown in map legend)", color: MISSING_COLOR },
                ].map((m) => (
                  <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ display: "inline-block", width: 16, height: 16, background: m.color, border: "1px solid rgba(0,0,0,0.15)", borderRadius: 2 }} />
                    <span style={{ fontFamily: "monospace" }}>{m.color}</span>
                    <span>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
}

createRoot(document.querySelector("#demo")).render(<Demo />);
