import React, { useState, useEffect } from "react";
import { startCase } from "lodash-es";
import { getDatasetsBatch } from "../api/dataset";
import DataLoader from "dataloader";

// A source is credited per kind of information, which for the same source record
// reads better on one line, e.g. the published in page and its link from BHL.
const groupBySource = (secondarySources) =>
  Object.values(
    Object.entries(secondarySources || {}).reduce((groups, [key, src]) => {
      const id = `${src.datasetKey}:${src.id}`;
      groups[id] = groups[id] || { id, src, keys: [] };
      groups[id].keys.push(key);
      return groups;
    }, {})
  );

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
    ? groupBySource(info?.source?.secondarySources).map(({ id, src, keys }) => (
        <React.Fragment key={id}>
          {keys.map((key) => startCase(key)).join(", ")}:{" "}
          <a
            href={`https://www.checklistbank.org/dataset/${src.datasetKey}/taxon/${encodeURIComponent(src.id)}`}
          >
            {datasets[src.datasetKey]?.title || src.datasetKey}
          </a>
        </React.Fragment>
      ))
    : null;
};

export default SecondarySources;
