import React from "react";
import {
  Tag,
  Icon
} from "antd";
import _ from "lodash";
import { stringToColour } from "../util";

import TaxonSources from "./TaxonSources"




class ColTreeNode extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      style: {},
      provisional: this.props.taxon.status === 'provisionally accepted'
    };
  }

  render = () => {
    const {
      taxon,
      taxon: { sector, datasetSectors },
      catalogueKey,
      pathToTaxon
    } = this.props;

    const sectorSourceDataset = _.get(sector, 'dataset') ;


    return (
        <div >
        <span 
        onContextMenu={()=> {
          const uri = catalogueKey === taxon.datasetKey ? `/catalogue/${catalogueKey}/taxon/${taxon.id}` : `/catalogue/${catalogueKey}/dataset/${selectedSourceDatasetKey}/taxon/${taxon.id}`
          const win = window.open(uri, '_blank');
          win.focus();
        }}>
        <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
          {taxon.rank}:{" "}
        </span>
        <a 
        dangerouslySetInnerHTML={{ __html: taxon.name }}
        onClick={()=> {
            window.location.href =  `${pathToTaxon}${taxon.id}`;
            
          }} 
        />
        </span>
        {!_.isUndefined(taxon.estimate)  && (
          <span>
            {" "}
            • {_.get(taxon, 'estimate')}{" "}
              <span> est. </span>
          
            described species
          </span>
        )}
        {taxon.status !== "accepted" && (
          <Tag color="red" style={{ marginLeft: "6px" }}>
            {taxon.status}
          </Tag>
        )}

         {datasetSectors && <TaxonSources datasetSectors={datasetSectors} taxon={taxon} catalogueKey={catalogueKey} />} 
        {sector && (
          <span>
            <span> • </span>
            <Tag color={stringToColour(sectorSourceDataset.title)}>
                {sectorSourceDataset.alias || sectorSourceDataset.key}
              </Tag> 
          </span>
        )}
      </div>
    );
  };
}

export default ColTreeNode;


