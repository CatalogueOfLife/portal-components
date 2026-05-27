import axios from "axios";
import config from "../config";

const reflect = (p) =>
  p.then(
    (v) => v.data,
    (e) => null
  );

// Bulk lookup using the API's `/source/simple?id=…&id=…` endpoint. One
// HTTP request resolves all ids in the batch. The endpoint returns a
// lightweight dataset object per id; results may come back in any order,
// so we reorder by `key` to match what DataLoader expects (same length
// and same order as the requested ids).
export const getDatasetsBatch = (ids, datasetKey) => {
  if (!ids?.length) return Promise.resolve([]);
  const params = ids.map((id) => `id=${encodeURIComponent(id)}`).join("&");
  return axios(`${config.dataApi}dataset/${datasetKey}/source/simple?${params}`)
    .then((res) => {
      const byKey = new Map();
      (res.data || []).forEach((d) => byKey.set(d.key, d));
      return ids.map((id) => byKey.get(id) ?? byKey.get(Number(id)) ?? null);
    })
    .catch(() => ids.map(() => null));
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
