import React from "react";
import config from "../config";
import client from "../api/client";
import {Skeleton} from "antd";
import { get } from "lodash-es";
import { LinkTo } from "../router";
import MergedDataBadge from "../components/MergedDataBadge";

// Resolves the search hit for the taxon a sector contributes, by exact name.
// Merge and union sectors bring the descendants of their subject but never the
// subject itself, so their target stands in for them. Any other sector brings
// its subject: searched within the sector only, preferring the hit placed right
// below the target, so neither a homonym from another source nor a same-named
// taxon nested inside the sector is taken for it.
const findSectorTaxon = (datasetKey, sector) => {
  const { id, mode, subject, target } = sector;
  const byTarget = mode === "merge" || mode === "union";
  const params = new URLSearchParams({ TAXON_ID: target.id });
  if (byTarget) {
    params.set("q", target.name);
  } else {
    params.set("SECTOR_KEY", id);
    if (subject.rank) params.set("rank", subject.rank);
    params.set("q", subject.name);
  }
  params.set("type", "EXACT");
  return client(
    `${config.dataApi}dataset/${datasetKey}/nameusage/search?${params}`
  ).then((res) => {
    const hits = get(res, "data.result") || [];
    if (byTarget) {
      return hits.find((h) => h.usage?.id === target.id);
    }
    const parentId = (h) => h.classification?.[h.classification.length - 2]?.id;
    return hits.find((h) => parentId(h) === target.id) || hits[0];
  });
};

const searchable = (s) =>
  !!s?.target?.id &&
  (s.mode === "merge" || s.mode === "union" ? !!s.target.name : !!s.subject?.name);

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
    client(
      `${config.dataApi}dataset/${datasetKey}/sector?limit=1000&subjectDatasetKey=${dataset.key}`
    ).then((res) => {
      return Promise.allSettled(
        res.data.result.filter(searchable).map((s) =>
          findSectorTaxon(datasetKey, s)
          .then((hit) => {
            if (hit) {
              const cl = hit.classification;
              const path = cl
                .slice(1, cl.length - 1)
                .map((t) => t.name)
                .join(" > ");
              // merge sectors only exist in an extended release (XR)
              const entry = { taxon: cl[cl.length - 1], merged: s.mode === "merge" };
              if (taxonMap[path]) {
                taxonMap[path].push(entry);
              } else {
                taxonMap[path] = [entry];
              }
            }
          })
          .catch(err => {
            console.log(s)
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
            {taxonMap[k].map(({ taxon, merged }, idx) => (
              <React.Fragment key={idx}>
                {merged && <MergedDataBadge />}
                <LinkTo to="tree" args={{ taxonKey: taxon.id }}>{taxon.name}</LinkTo>
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
