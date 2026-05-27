import TaxonBreakdown from "./TaxonBreakdown";
import React, { useEffect, useState } from "react";
import axios from "axios";
import config from "../config";
import { Row, Col, Spin } from "antd";
import { RouterContext, buildRouter } from "../router";

export const BreakDownWrapper = ({
  taxonId,
  datasetKey,
  level = 1,
  showLevelSwitch = false,
  darkMode,
  ...routerProps
}) => {
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
    axios(`${config.dataApi}vocab/rank`).then((res) =>
      setRank(res.data.map((r) => r.name))
    );
  const getTaxon = () =>
    axios(`${config.dataApi}dataset/${datasetKey}/taxon/${taxonId}`).then(
      (res) => setTaxon(res.data)
    );
  const getDataset = () =>
    axios(`${config.dataApi}dataset/${datasetKey}`).then((res) =>
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
