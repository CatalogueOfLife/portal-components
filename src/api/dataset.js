import axios from "axios";
import config from "../config";

const reflect = (p) =>
  p.then(
    (v) => v.data,
    (e) => null
  );

export const getDatasetsBatch = (ids, catalogueKey) => {
  return Promise.all(
    ids.map((i) =>
      reflect(axios(`${config.dataApi}dataset/${catalogueKey}/source/${i}`))
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
