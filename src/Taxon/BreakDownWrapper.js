import TaxonBreakdown from "./TaxonBreakdown";
import React,  { useEffect, useState } from "react";
import axios from "axios";
import config from "../config";
import {Row, Col, Spin} from "antd";
export const BreakDownWrapper = ({ taxonId, datasetKey, pathToTaxon }) => {
  const [taxon, setTaxon] = useState(null);
  const [dataset, setDataset] = useState(null);
  const [rank, setRank] = useState([]);

  useEffect(() => {
    getRank();
    if (taxonId && datasetKey) {
      getTaxon();
    }
    if (datasetKey) {
      getDataset();
    }
  }, [taxonId, datasetKey]);

  const getRank = () => {
    axios(`${config.dataApi}vocab/rank`).then((res) =>
      setRank(res.data.map((r) => r.name))
    );
  };
  const getTaxon = () => {
    axios(`${config.dataApi}dataset/${datasetKey}/taxon/${taxonId}`).then(
      (res) => {
        const taxon = res.data;
        setTaxon(taxon);
      }
    );
  };
  const getDataset = () => {
    axios(`${config.dataApi}dataset/${datasetKey}`).then((res) => {
      const dataset = res.data;
      setDataset(dataset);
    });
  };
  return ((!!taxon && !!dataset) && rank.length > 0) ? (
      <TaxonBreakdown
        taxon={taxon}
        datasetKey={datasetKey}
        rank={rank}
        pathToTaxon={pathToTaxon}
        dataset={dataset}
      />
  ) : <Row justify="center" style={{ padding: "24px" }}>
    <Col>
      <Spin size="large" />
    </Col>
  </Row>;
};
