import './index.less';
import withDatasetKey, { withBibTexLegacyShim } from "./withDatasetKey";
import colTree from "./ColTree"
import taxon from "./Taxon"
import search from "./Search"
import dataset from "./Dataset"
import datasetSearch from "./DatasetSearch"
import bibTex from "./components/BibTex"
import { BreakDownWrapper } from './Taxon/BreakDownWrapper';
export const Tree = withDatasetKey(colTree);
export const Taxon = withDatasetKey(taxon);
export const Search = withDatasetKey(search);
export const Dataset = withDatasetKey(dataset);
export const DatasetSearch = withDatasetKey(datasetSearch);
export const BibTex = withBibTexLegacyShim(bibTex);
export const TaxonBreakdown = BreakDownWrapper;
