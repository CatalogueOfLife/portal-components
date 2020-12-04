import React from "react";
import { Tag } from "antd";
import _ from "lodash";
// import config from "../config";
import TaxonSources from "./TaxonSources";
import TaxonEstimate from "./TaxonEstimate";
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

    const estimate = taxon.estimate && taxon.estimates ? taxon.estimates.find(e => e.estimate === taxon.estimate) : null;
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
                        {/* estimate && (
                          <span>
                            {" "}
                            • <TaxonEstimate estimate={estimate} taxon={taxon} />
                          </span>
                        ) */}
                        {taxon.status === "provisionally accepted" && (
                          <React.Fragment> • <Tag color="warning" style={{marginRight: 0}}>
                            prov.
                          </Tag>
                          </React.Fragment>
                        )}
                
                        {datasetSectors && (
                          <React.Fragment> • <TaxonSources
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
