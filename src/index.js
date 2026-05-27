import './index.less';
import withDatasetKey, { withBibTexLegacyShim } from "./withDatasetKey";
import { withTheme } from "./withTheme";
import colTree from "./ColTree"
import taxon from "./Taxon"
import search from "./Search"
import dataset from "./Dataset"
import datasetSearch from "./DatasetSearch"
import bibTex from "./components/BibTex"
import { BreakDownWrapper } from './Taxon/BreakDownWrapper';
export const Tree = withTheme(withDatasetKey(colTree));
export const Taxon = withTheme(withDatasetKey(taxon));
export const Search = withTheme(withDatasetKey(search));
export const Dataset = withTheme(withDatasetKey(dataset));
export const DatasetSearch = withTheme(withDatasetKey(datasetSearch));
export const BibTex = withTheme(withBibTexLegacyShim(bibTex));
export const TaxonBreakdown = withTheme(BreakDownWrapper);
