import TaxonBreakdown from "./TaxonBreakdown";
import React, { useEffect, useState } from "react";
import client, { setAuth } from "../api/client";
import config from "../config";
import { Row, Col, Spin } from "antd";
import { RouterContext, buildRouter } from "../router";

export const BreakDownWrapper = ({
  taxonId,
  datasetKey,
  level = 1,
  showLevelSwitch = false,
  darkMode,
  auth,
  ...routerProps
}) => {
  // Private candidate releases (preview/dev) require Basic auth on every call,
  // including the breakdown's taxon/dataset/rank fetches via `client`.
  setAuth(auth);
  const [taxon, setTaxon] = useState(null);
  const [dataset, setDataset] = useState(null);
  const [rank, setRank] = useState([]);

  useEffect(() => {
    if (taxonId && datasetKey) getTaxon();
    if (datasetKey) {
      getDataset();
      getRank();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxonId, datasetKey]);

  const getRank = () =>
    client(`${config.dataApi}vocab/rank`).then((res) =>
      setRank(res.data.map((r) => r.name))
    );
  const getTaxon = () =>
    client(`${config.dataApi}dataset/${datasetKey}/taxon/${taxonId}`).then(
      (res) => setTaxon(res.data)
    );
  const getDataset = () =>
    client(`${config.dataApi}dataset/${datasetKey}`).then((res) =>
      setDataset(res.data)
    );

  return (
    <RouterContext.Provider value={buildRouter(routerProps)}>
      {!!taxon && !!dataset && rank.length > 0 ? (
        <TaxonBreakdown
          taxon={taxon}
          datasetKey={datasetKey}
          rank={rank}
          dataset={dataset}
          level={level}
          showLevelSwitch={showLevelSwitch}
          darkMode={darkMode}
        />
      ) : (
        <Row justify="center" style={{ padding: "24px" }}>
          <Col>
            <Spin size="large" />
          </Col>
        </Row>
      )}
    </RouterContext.Provider>
  );
};
