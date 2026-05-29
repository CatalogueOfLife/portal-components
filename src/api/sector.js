import client from "./client";
import config from "../config";

const reflect = p => p.then(v => v.data, e => null);

export const getSectorsBatch = (ids, datasetKey) => {
  return Promise.all(
    ids.map(i => reflect(client(`${config.dataApi}dataset/${datasetKey}/sector/${i}`)))
  );
};
