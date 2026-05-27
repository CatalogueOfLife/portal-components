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
//
// Tolerates any failure mode (404, network error, malformed response, …)
// by resolving every id in the failing batch to null. Returning the
// expected-length array is critical — DataLoader rejects every pending
// load() if the batch function rejects or returns the wrong length, and
// the per-id load() rejections would in turn reject the Promise.all in
// TaxonSources and leave the popover spinner stuck.
export const getDatasetsBatch = (ids, datasetKey) => {
  if (!ids?.length) return Promise.resolve([]);
  const nullsForAll = () => ids.map(() => null);
  const params = ids.map((id) => `id=${encodeURIComponent(id)}`).join("&");
  return axios(`${config.dataApi}dataset/${datasetKey}/source/simple?${params}`)
    .then((res) => {
      try {
        const byKey = new Map();
        const arr = Array.isArray(res?.data) ? res.data : [];
        arr.forEach((d) => {
          if (d && d.key != null) byKey.set(d.key, d);
        });
        return ids.map((id) => byKey.get(id) ?? byKey.get(Number(id)) ?? null);
      } catch (parseErr) {
        return nullsForAll();
      }
    })
    .catch(() => nullsForAll());
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
