import React, { useEffect, useState } from "react";
import axios from "axios";
import config from "../config";
import { Row, Col, Spin } from "antd";
import Distributions from "./Distributions";
import { RouterContext, buildRouter } from "../router";

// Standalone wrapper around the Taxon page's Distributions block.
// Loads the focal taxon, its info (which carries the distributions array),
// and the rank vocabulary — same data the Taxon page already loads — so
// embedders can drop the map onto any page given just (datasetKey, taxonId).
export const DistributionsWrapper = ({
  taxonId,
  datasetKey,
  gbifChecklistKey,
  style,
  ...routerProps
}) => {
  const [taxon, setTaxon] = useState(null);
  const [distributions, setDistributions] = useState(null);
  const [rank, setRank] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setTaxon(null);
    setDistributions(null);

    if (!taxonId || !datasetKey) return undefined;

    axios(`${config.dataApi}vocab/rank`).then((res) => {
      if (!cancelled) setRank(res.data.map((r) => r.name));
    });
    axios(
      `${config.dataApi}dataset/${datasetKey}/taxon/${encodeURIComponent(taxonId)}`
    ).then((res) => {
      if (!cancelled) setTaxon(res.data);
    });
    axios(
      `${config.dataApi}dataset/${datasetKey}/taxon/${encodeURIComponent(taxonId)}/info`
    ).then((res) => {
      if (!cancelled) setDistributions(res?.data?.distributions || []);
    });

    return () => {
      cancelled = true;
    };
  }, [taxonId, datasetKey]);

  return (
    <RouterContext.Provider value={buildRouter(routerProps)}>
      {!taxon || distributions === null || rank.length === 0 ? (
        <Row justify="center" style={{ padding: "24px" }}>
          <Col>
            <Spin size="large" />
          </Col>
        </Row>
      ) : (
        <Distributions
          data={distributions}
          datasetKey={datasetKey}
          focalTaxon={taxon}
          rankOrder={rank}
          gbifChecklistKey={gbifChecklistKey}
          showDistributionMap={true}
          style={style}
        />
      )}
    </RouterContext.Provider>
  );
};

export default DistributionsWrapper;
