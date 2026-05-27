import React from "react";
import config from "../config";
import axios from "axios";
import {Skeleton} from "antd";
import _ from "lodash";
import { LinkTo } from "../router";

class TaxonomicCoverage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      taxonMap: null
    };
  }

  componentDidMount() {
    this.getData();
  }

  getData = () => {
    const { dataset, datasetKey } = this.props;
    const taxonMap = {};
    axios(
      `${config.dataApi}dataset/${datasetKey}/sector?limit=1000&subjectDatasetKey=${dataset.key}`
    ).then((res) => {
      return Promise.allSettled(
        res.data.result.filter(t => !!t?.target).map((t) =>
          axios(
            `${config.dataApi}dataset/${datasetKey}/nameusage/search?TAXON_ID=${t?.target?.id}${t?.subject?.rank ? "&rank="+t?.subject?.rank : ""}&q=${t?.subject?.name}`
          ).then((usages) => {
            const taxon = _.get(usages, "data.result[0]");
            if (taxon) {
              const path = taxon.classification
                .slice(1, taxon.classification.length - 1)
                .map((t) => t.name)
                .join(" > ");
              if (taxonMap[path]) {
                taxonMap[path].push(
                  taxon.classification[taxon.classification.length - 1]
                );
              } else {
                taxonMap[path] = [
                  taxon.classification[taxon.classification.length - 1],
                ];
              }
            }
          })
          .catch(err => {
            console.log(t)
            console.log(err)})
        )
      ).then(() => this.setState({ taxonMap, loading: false }));
    });
  };

  render = () => {
    const { taxonMap } = this.state;
    const { style } = this.props;
    return taxonMap
      ? (Object.keys(taxonMap).length > 0 ? Object.keys(taxonMap).sort((a,b) => a.length - b.length).map((k) => (
          <div style={style} key={k}>
            <span>{k}{k !== "" ? ":" : ""}</span>{" "}
            {taxonMap[k].map((tx, idx) => (
              <React.Fragment key={idx}>
                <LinkTo to="tree" args={{ taxonKey: tx.id }}>{tx.name}</LinkTo>
                {idx !== taxonMap[k].length - 1 ? ", " : ""}
              </React.Fragment>
            ))}
          </div>
        )) : "N/A")
      :
        <Skeleton active paragraph={{ rows: 4 }} />
      ;
  };
}

export default TaxonomicCoverage;
