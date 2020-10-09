import React from "react";
import { Tag } from "antd";
import _ from "lodash";
import config from "../config";
import TaxonSources from "./TaxonSources";
import DatasetlogoWithFallback from "../components/DatasetlogoWithFallback";

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
      <div>
        <span>
          <span className="tree-node-rank">{taxon.rank}: </span>
          <a
            dangerouslySetInnerHTML={{ __html: taxon.name }}
            href={`${pathToTaxon}${taxon.id}`}
            onClick={() => {
              window.location.href = `${pathToTaxon}${taxon.id}`;
            }}
          />
        </span>
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
              href={`${pathToDataset}${sectorSourceDataset.key}`}
              onClick={() => {
                window.location.href = `${pathToDataset}${sectorSourceDataset.key}`;
              }}
            >
              {sectorSourceDataset.alias || sectorSourceDataset.key}{" "}
              <DatasetlogoWithFallback
                style={{ maxHeight: "20px", width: "auto" }}
                datasetKey={sector.subjectDatasetKey}
                size="SMALL"
              />
            </a>
          </span>
        )}
      </div>
    );
  };
}

export default ColTreeNode;
