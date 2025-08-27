import React from "react";
import ColTree from "./ColTree";
import { Router } from "react-router-dom";
import qs from "query-string";
import _ from "lodash";
import history from "../history";
import NameAutocomplete from "./NameAutocomplete";
import axios from "axios";
import btoa from "btoa";
import { Row, Col, Switch, Checkbox, Form, Tooltip, Popover } from "antd";
import { ColTreeContext } from "./ColTreeContext";
import { getDataset } from "../api/dataset";
import Citation from "../components/DatasetCitation";

const INFRASPECIFIC_RANKS = [
  "infraspecific name",
  "species",
  "variety",
  "form",
];

class ColTreeWrapper extends React.Component {
  constructor(props) {
    super(props);
    if (this.props.auth) {
      axios.defaults.headers.common["Authorization"] = `Basic ${btoa(
        this.props.auth
      )}`;
    }
    this.state = {
      insertPlaceholder: true,
      hideExtinct: false,
      showInfo: false,
      dataset: null,
    };
  }

  componentDidMount = async () => {
    const { catalogueKey, citation } = this.props;
    if (citation) {
      try {
        const { data: dataset } = await getDataset(catalogueKey);
        this.setState({ dataset });
      } catch (err){

      }
    }
  };

  render = () => {
    const {
      catalogueKey,
      pathToTaxon,
      pathToDataset,
      defaultTaxonKey,
      showTreeOptions,
      linkToSpeciesPage,
      citation,
      type
    } = this.props;
    const { hideExtinct, insertPlaceholder, dataset } = this.state;
    const params = qs.parse(_.get(location, "search"));
    return (
      <Router history={history}>
        <div className="catalogue-of-life">
          {citation === "top" && dataset && <Citation dataset={dataset} />}
          <ColTreeContext.Provider value={this.state}>
            <Row>
              <Col flex="auto">
                <NameAutocomplete
                  hideExtinct={hideExtinct}
                  datasetKey={catalogueKey}
                  style={{
                    width: "100%",
                    paddingTop: "5px",
                    paddingBottom: "5px",
                  }}
                  defaultTaxonKey={_.get(params, "taxonKey") || null}
                  onSelectName={(name) => {
                    if (
                      linkToSpeciesPage &&
                      INFRASPECIFIC_RANKS.includes(_.get(name, "rank"))
                    ) {
                      if(typeof pathToTaxon === "string"){
                        window.location.href = `${pathToTaxon}${_.get(
                          name,
                          "key"
                        )}`;
                      } else if(typeof pathToTaxon === "function"){
                        pathToTaxon(_.get(
                          name,
                          "key"
                        ))
                      }
                      
                    } else {
                      const newParams = {
                        ...params,
                        taxonKey: _.get(name, "key"),
                      };

                      history.push({
                        pathname: location.path,
                        search: `?${qs.stringify(newParams)}`,
                      });
                      this.treeRef.reloadRoot();
                    }
                  }}
                  onResetSearch={() => {
                    const newParams = { ...params, taxonKey: null };
                    history.push({
                      pathname: location.path,
                      search: `?${qs.stringify(
                        _.omit(newParams, ["taxonKey"])
                      )}`,
                    });
                  }}
                />
              </Col>
              {showTreeOptions && (
                <Col style={{ paddingLeft: "8px" }}>
                  <Checkbox
                    onChange={({ target: { checked } }) => {
                      this.setState({ showInfo: checked });
                    }}
                  >
                    Info
                  </Checkbox>

                  <Checkbox
                    defaultChecked={false}
                    onChange={({ target: { checked } }) => {
                      this.setState({ hideExtinct: checked });
                    }}
                  >
                    Extant only
                  </Checkbox>
                  <Tooltip
                            placement="left"
                            title={"This virtually groups children of lower ranks into a \"Not assigned\" node for a more compact browsing experience"}
                            getPopupContainer={() => document.getElementById("col_insertPlaceholder")}
                          trigger={"hover"}
                         >
                          <div id="col_insertPlaceholder" style={{ display: "inline-block" }}>
                  <Checkbox
                    
                    defaultChecked={true}
                    onChange={({ target: { checked } }) => {
                      this.setState({ insertPlaceholder: checked });
                    }}
                  >
                    Placeholder
                  </Checkbox>
                  </div>
                  </Tooltip>
                  
                </Col>
              )}
            </Row>
            <ColTree
              insertPlaceholder={insertPlaceholder}
              hideExtinct={hideExtinct}
              catalogueKey={catalogueKey}
              pathToTaxon={pathToTaxon}
              pathToDataset={pathToDataset}
              defaultTaxonKey={defaultTaxonKey}
              treeRef={(ref) => (this.treeRef = ref)}
              type={type}
            />
          </ColTreeContext.Provider>
          {citation === "bottom" && dataset && <Citation dataset={dataset} />}
        </div>
      </Router>
    );
  };
}

export default ColTreeWrapper;
