import React from "react";
import { Tag } from "antd";
import _ from "lodash";
// import config from "../config";
import TaxonSources from "./TaxonSources";
import TaxonEstimate from "./TaxonEstimate";
import MergedDataBadge from "../components/MergedDataBadge";
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

  rankIsAboveSpecies = (rank) => {
    return this.props.rank.indexOf(rank) < this.props.rank.indexOf("species");
  };

  render = () => {
    const {
      taxon,
      taxon: { sector, sourceDatasetKeys, publisherDatasetKeys },
      catalogueKey,
      pathToTaxon,
      pathToDataset,
    } = this.props;

    const sectorSourceDataset = _.get(sector, "dataset");
/*     const hasDatasetSectors = datasetSectors && ( sector && sector.subjectDatasetKey ? Object.keys(_.omit(datasetSectors, [sector.subjectDatasetKey])).length > 0 : true)
 */    
const hasDatasetSectors =
(sourceDatasetKeys || []).filter((d) => sector?.subjectDatasetKey !== d)
  .length > 0;
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
                            disabled={taxon?.id?.indexOf("--incertae-sedis--") > -1 ? true : false}
                            
                            onClick={(e) => {
                              if(typeof pathToTaxon === "string"){
                                window.location.href = `${pathToTaxon}${taxon.id}`;
                              } else if(typeof pathToTaxon === "function"){
                                e.preventDefault()
                                pathToTaxon(taxon.id)
                              }
                              
                            }}
                          />
                          {taxon?.merged && (
                          <MergedDataBadge style={{ marginLeft: "4px" }} datasetKey={taxon?.datasetKey} verbatimSourceKey={taxon?.verbatimSourceKey}/>
                        )}
                        </span>
                        {/* estimate && (
                          <span>
                            {" "}
                            • <TaxonEstimate estimate={estimate} taxon={taxon} />
                          </span>
                        ) */}
                        {showInfo && taxon.status === "provisionally accepted" && (
                          <React.Fragment> • <Tag color="warning" style={{marginRight: 0}}>
                            prov.
                          </Tag>
                          </React.Fragment>
                        )}

                      {!_.isUndefined(taxon.count) &&
                        this.rankIsAboveSpecies(taxon?.rank) && (
                          <span>
                            {" "}
                            • {Number(taxon.count).toLocaleString()}{" "}
                            {showInfo && !_.isUndefined(taxon.speciesEstimate) && (
                              <span>
                                {" "}
                                of{" "}
                                {Number(
                                  taxon.speciesEstimate
                                ).toLocaleString()}{" "}
                                est.{" "}
                              </span>
                            )}
                            spp.
                          </span>
                        )}  
                
                        
                        {showInfo && sector && (
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
                        {showInfo && hasDatasetSectors && (
                          <React.Fragment> <TaxonSources
/*                               datasetSectors={sector && sector.subjectDatasetKey ? _.omit(datasetSectors, [sector.subjectDatasetKey]) : datasetSectors}
 */                           sourceDatasetKeys={sourceDatasetKeys}
 publisherDatasetKeys={publisherDatasetKeys}

                              pathToDataset={pathToDataset}
                              taxon={taxon}
                              catalogueKey={catalogueKey}
                            />
                          </React.Fragment>
                        )}
                        
                      </div>
                )}
              </ColTreeContext.Consumer>

    );
  };
}

export default ColTreeNode;
