import React from "react";
import { Tag } from "antd";
import _ from "lodash";
import TaxonSources from "./TaxonSources";
import MergedDataBadge from "../components/MergedDataBadge";
import {ColTreeContext} from "./ColTreeContext"
import { LinkTo } from "../router";

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
      datasetKey,
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
                          <LinkTo to="taxon" args={taxon.id}>
                            <span dangerouslySetInnerHTML={{ __html: taxon.labelHtml }} />
                          </LinkTo>
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
                            <LinkTo
                              to="source"
                              args={sector.subjectDatasetKey}
                              style={hasDatasetSectors ? {fontWeight: 'bold'} : null}
                              className="col-tree-data-source"
                            >
                              {_.get(sectorSourceDataset, "alias") || sector.subjectDatasetKey}{hasDatasetSectors && ", "}
                            </LinkTo>
                          </span>
                        )}
                        {showInfo && hasDatasetSectors && (
                          <React.Fragment> <TaxonSources
                              sourceDatasetKeys={sourceDatasetKeys}
                              publisherDatasetKeys={publisherDatasetKeys}
                              taxon={taxon}
                              datasetKey={datasetKey}
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
