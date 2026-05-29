import React from "react";
import ColTree from "./ColTree";
import { get } from "lodash-es";
import NameAutocomplete from "./NameAutocomplete";
import client, { setAuth } from "../api/client";
import { Row, Col, Checkbox } from "antd";
import { ColTreeContext } from "./ColTreeContext";
import { TreeCacheContext, createTreeCache } from "./treeCache";
import { getDataset } from "../api/dataset";
import Citation from "../components/DatasetCitation";
import { RouterContext, buildRouter } from "../router";

const INFRASPECIFIC_RANKS = [
  "infraspecific name",
  "species",
  "variety",
  "form",
];

class ColTreeWrapper extends React.Component {
  static contextType = RouterContext;

  constructor(props) {
    super(props);
    setAuth(this.props.auth);
    this.state = {
      hideExtinct: false,
      showInfo: false,
      dataset: null,
    };
    // Per-Tree DataLoader cache. Rebuilt only if datasetKey changes (rare).
    this.cache = createTreeCache(this.props.datasetKey);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.datasetKey !== this.props.datasetKey) {
      this.cache = createTreeCache(this.props.datasetKey);
    }
  }

  componentDidMount = async () => {
    const { datasetKey, citation } = this.props;
    if (citation) {
      try {
        const { data: dataset } = await getDataset(datasetKey);
        this.setState({ dataset });
      } catch (err) {
        // ignore
      }
    }
  };

  render = () => {
    const {
      datasetKey,
      defaultTaxonKey,
      expandedTaxonKey,
      onExpandedTaxonKeyChange,
      showTreeOptions,
      linkToSpeciesPage,
      citation,
      type,
      insertPlaceholder = true,
    } = this.props;
    const { hideExtinct, dataset } = this.state;

    const handleSelectName = (name) => {
      const key = get(name, "key");
      if (!key) return;
      const rank = get(name, "rank");
      if (linkToSpeciesPage && INFRASPECIFIC_RANKS.includes(rank)) {
        // Leaf-like selection: jump to the taxon page via the host's nav.
        const navigateToTaxon = this.context?.taxon?.onNavigate;
        if (navigateToTaxon) navigateToTaxon(key);
      } else if (onExpandedTaxonKeyChange) {
        onExpandedTaxonKeyChange(key);
        if (this.treeRef && this.treeRef.reloadRoot) this.treeRef.reloadRoot();
      }
    };

    const handleResetSearch = () => {
      if (onExpandedTaxonKeyChange) onExpandedTaxonKeyChange(null);
    };

    return (
      <div className="catalogue-of-life">
        {citation === "top" && dataset && <Citation dataset={dataset} />}
        <TreeCacheContext.Provider value={this.cache}>
        <ColTreeContext.Provider value={this.state}>
          <Row>
            <Col flex="auto">
              <NameAutocomplete
                hideExtinct={hideExtinct}
                datasetKey={datasetKey}
                style={{
                  width: "100%",
                  paddingTop: "5px",
                  paddingBottom: "5px",
                }}
                defaultTaxonKey={expandedTaxonKey || null}
                onSelectName={handleSelectName}
                onResetSearch={handleResetSearch}
              />
            </Col>
            {showTreeOptions && (
              <Col style={{ paddingLeft: "8px" }}>
                <Checkbox
                  onChange={({ target: { checked } }) => {
                    this.setState({ showInfo: checked });
                  }}
                >
                  Source
                </Checkbox>

                <Checkbox
                  defaultChecked={false}
                  onChange={({ target: { checked } }) => {
                    this.setState({ hideExtinct: checked });
                  }}
                >
                  Extant only
                </Checkbox>
              </Col>
            )}
          </Row>
          <ColTree
            insertPlaceholder={insertPlaceholder}
            hideExtinct={hideExtinct}
            datasetKey={datasetKey}
            defaultTaxonKey={defaultTaxonKey}
            expandedTaxonKey={expandedTaxonKey}
            onExpandedTaxonKeyChange={onExpandedTaxonKeyChange}
            treeRef={(ref) => (this.treeRef = ref)}
            type={type}
          />
        </ColTreeContext.Provider>
        </TreeCacheContext.Provider>
        {citation === "bottom" && dataset && <Citation dataset={dataset} />}
      </div>
    );
  };
}

// Public wrapper: takes controlled props + navigation callbacks, builds
// the RouterContext, hands the rest down.
export default function Tree({
  datasetKey,
  defaultTaxonKey,
  expandedTaxonKey,
  onExpandedTaxonKeyChange,
  showTreeOptions,
  linkToSpeciesPage,
  citation,
  type,
  insertPlaceholder,
  auth,
  ...routerProps
}) {
  return (
    <RouterContext.Provider value={buildRouter(routerProps)}>
      <ColTreeWrapper
        datasetKey={datasetKey}
        defaultTaxonKey={defaultTaxonKey}
        expandedTaxonKey={expandedTaxonKey}
        onExpandedTaxonKeyChange={onExpandedTaxonKeyChange}
        showTreeOptions={showTreeOptions}
        linkToSpeciesPage={linkToSpeciesPage}
        citation={citation}
        type={type}
        insertPlaceholder={insertPlaceholder}
        auth={auth}
      />
    </RouterContext.Provider>
  );
}
