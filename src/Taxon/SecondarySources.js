import React, { useState, useEffect } from "react";
import _ from "lodash";
import { getDatasetsBatch } from "../api/dataset";
import DataLoader from "dataloader";

const SecondarySources = ({ info, datasetKey }) => {
  const [datasets, setDatasets] = useState({});

  useEffect(() => {
    if (info?.source?.secondarySources) getDatasets();
  }, [info]);

  const datasetLoader = new DataLoader((ids) => getDatasetsBatch(ids, datasetKey));

  const getDatasets = async () => {
    const data = {};
    try {
      await Promise.all(
        Object.keys(info?.source?.secondarySources || {}).map((key) =>
          datasetLoader
            .load(info?.source?.secondarySources[key].datasetKey)
            .then((dataset) => {
              data[dataset.key] = dataset;
            })
        )
      );
    } catch (error) {
      console.log(error);
    }
    setDatasets(data);
  };

  return info?.source?.secondarySources
    ? Object.keys(info?.source?.secondarySources || {}).map((key) => (
        <React.Fragment key={key}>
          {_.startCase(key)}:{" "}
          <a
            href={`https://www.checklistbank.org/dataset/${info?.source?.secondarySources?.[key]?.datasetKey}/taxon/${encodeURIComponent(info?.source?.secondarySources?.[key]?.id)}`}
          >
            {datasets[info?.source?.secondarySources?.[key]?.datasetKey]?.title ||
              info?.source?.secondarySources?.[key]?.datasetKey}
          </a>
        </React.Fragment>
      ))
    : null;
};

export default SecondarySources;
