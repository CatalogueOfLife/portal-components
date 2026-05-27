import axios from "axios";
import config from "../config";

const reflect = (p) =>
  p.then(
    (v) => v.data,
    (e) => null
  );

export const getDatasetsBatch = (ids, datasetKey) => {
  return Promise.all(
    ids.map((i) =>
      reflect(axios(`${config.dataApi}dataset/${datasetKey}/source/${i}`))
    )
  );
};

export const getPublishersBatch = (ids, datasetKey) => {
  return Promise.all(
    ids.map((i) =>
      reflect(axios(`${config.dataApi}dataset/${datasetKey}/sector/publisher/${i}`))
    )
  );
};

export const getCatalogues = () => {
  return axios(`${config.dataApi}dataset/catalogues`).then(({ data }) =>
    getDatasetsBatch(data)
  );
};

export const getDataset = (datasetKey) =>
  axios(`${config.dataApi}dataset/${datasetKey}`);

// Lightweight dataset descriptor — includes `origin`, `title`, `version`,
// `key`, etc. Used by Search to gate filter UI on the dataset's origin.
// TODO: switch to `/dataset/{key}/simple` once that endpoint deploys.
// The full /dataset/{key} response is a superset, so it works today.
export const getDatasetSimple = (datasetKey) =>
  axios(`${config.dataApi}dataset/${datasetKey}`);
