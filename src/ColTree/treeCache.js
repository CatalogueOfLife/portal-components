import { createContext } from "react";
import DataLoader from "dataloader";
import { getDatasetsBatch, getPublishersBatch } from "../api/dataset";

// Shared DataLoaders for the Tree subtree. Created once per (datasetKey,
// mounted Tree) and provided via TreeCacheContext so every TaxonSources,
// every sector-dataset decoration in ColTree, and any other in-tree
// consumer hits the same in-memory cache. Without this, each TaxonSources
// instance creates its own loader and the same source/publisher dataset
// is fetched once per node it appears under.
//
// DataLoader batches calls inside a microtask and caches resolved values
// indefinitely for the lifetime of the loader.

export const TreeCacheContext = createContext({
  datasetLoader: null,
  publisherLoader: null,
});

export const createTreeCache = (datasetKey) => ({
  datasetLoader: new DataLoader((ids) => getDatasetsBatch(ids, datasetKey)),
  publisherLoader: new DataLoader((ids) =>
    getPublishersBatch(ids, datasetKey)
  ),
});
