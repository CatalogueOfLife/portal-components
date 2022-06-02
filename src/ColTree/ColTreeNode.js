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
    const hasDatasetSectors = datasetSectors && ( sector && sector.subjectDatasetKey ? Object.keys(_.omit(datasetSectors, [sector.subjectDatasetKey])).length > 0 : true)
    const estimate = taxon.estimate && taxon.estimates ? taxon.estimates.find(e => e.estimate === taxon.estimate) : null;

    return (
      <ColTreeContext.Consumer>
                {({ showInfo }) => (
                        <div id={taxon.id}>
                        <span>
                          <span className="tree-node-rank">{taxon.rank}: </span>
                          <a
                            dangerouslySetInnerHTML={{ __html: taxon.labelHtml }}
                            href={typeof pathToTaxon === "string" ? `${pathToTaxon}${taxon.id}`: "#"}
                            onClick={(e) => {
                              if(typeof pathToTaxon === "string"){
                                window.location.href = `${pathToTaxon}${taxon.id}`;
                              } else if(typeof pathToTaxon === "function"){
                                e.preventDefault()
                                pathToTaxon(taxon.id)
                              }
                              
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
                
                        
                        {sector && (
                          <span>
                            <span> • </span>
                            <a
                              style={hasDatasetSectors ? {fontWeight: 'bold'} : null}
                              href={`${pathToDataset}${sector.subjectDatasetKey}`}
                              className="col-tree-data-source"
                              onClick={() => {
                                window.location.href = `${pathToDataset}${sector.subjectDatasetKey}`;
                              }}
                            >
                              {_.get(sectorSourceDataset, "alias") || sector.subjectDatasetKey}{hasDatasetSectors && ", "}
                              {/* <DatasetlogoWithFallback
                                style={{ maxHeight: "20px", width: "auto" }}
                                catalogueKey={catalogueKey}
                                datasetKey={sector.subjectDatasetKey}
                                size="SMALL"
                              /> */}
                            </a>
                          </span>
                        )}
                        {hasDatasetSectors && (
                          <React.Fragment> <TaxonSources
                              datasetSectors={sector && sector.subjectDatasetKey ? _.omit(datasetSectors, [sector.subjectDatasetKey]) : datasetSectors}
                              pathToDataset={pathToDataset}
                              taxon={taxon}
                              catalogueKey={catalogueKey}
                            />
                          </React.Fragment>
                        )}
                         </React.Fragment>}
                        
                      </div>
                )}
              </ColTreeContext.Consumer>

    );
  };
}

export default ColTreeNode;
