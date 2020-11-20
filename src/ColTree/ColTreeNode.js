import React from "react";
import { Tag } from "antd";
import _ from "lodash";
// import config from "../config";
import TaxonSources from "./TaxonSources";
// import DatasetlogoWithFallback from "../components/DatasetlogoWithFallback";
import {ColTreeContext} from "./ColTreeContext"

class ColTreeNode extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      style: {},
      provisional: this.props.taxon.status === "provisionally accepted",
      loading: false,
    };
  }

  render = () => {
    const {
      taxon,
      taxon: { sector, datasetSectors },
      catalogueKey,
      pathToTaxon,
      pathToDataset,
    } = this.props;

    const sectorSourceDataset = _.get(sector, "dataset");

    return (
      <ColTreeContext.Consumer>
                {({ showInfo }) => (
                        <div id={taxon.id}>
                        <span>
                          <span className="tree-node-rank">{taxon.rank}: </span>
                          <a
                            dangerouslySetInnerHTML={{ __html: taxon.labelHtml }}
                            href={`${pathToTaxon}${taxon.id}`}
                            onClick={() => {
                              window.location.href = `${pathToTaxon}${taxon.id}`;
                            }}
                          />
                        </span>
                       {showInfo && <React.Fragment>
                        {!_.isUndefined(taxon.estimate) && (
                          <span>
                            {" "}
                            • {_.get(taxon, "estimate")} <span> est. spp.</span>
                          </span>
                        )}
                        {taxon.status !== "accepted" && (
                          <Tag color="red" style={{ marginLeft: "6px" }}>
                            {taxon.status}
                          </Tag>
                        )}
                
                        {datasetSectors && (
                          <React.Fragment>
                            {" •"}{" "}
                            <TaxonSources
                              datasetSectors={datasetSectors}
                              pathToDataset={pathToDataset}
                              taxon={taxon}
                              catalogueKey={catalogueKey}
                            />
                          </React.Fragment>
                        )}
                        {sector && (
                          <span>
                            <span> • </span>
                            <a
                              href={`${pathToDataset}${sector.subjectDatasetKey}`}
                              onClick={() => {
                                window.location.href = `${pathToDataset}${sector.subjectDatasetKey}`;
                              }}
                            >
                              {_.get(sectorSourceDataset, "alias") || sector.subjectDatasetKey}{" "}
                              {/* <DatasetlogoWithFallback
                                style={{ maxHeight: "20px", width: "auto" }}
                                catalogueKey={catalogueKey}
                                datasetKey={sector.subjectDatasetKey}
                                size="SMALL"
                              /> */}
                            </a>
                          </span>
                        )}
                         </React.Fragment>}
                        
                      </div>
                )}
              </ColTreeContext.Consumer>

    );
  };
}

export default ColTreeNode;
