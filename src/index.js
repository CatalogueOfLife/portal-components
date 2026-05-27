import './index.less';
import withDatasetKey, { withBibTexLegacyShim } from "./withDatasetKey";
import { withTheme } from "./withTheme";
import colTree from "./ColTree"
import taxon from "./Taxon"
import search from "./Search"
import sourceDataset from "./SourceDataset"
import sourceDatasetList from "./SourceDatasetList"
import bibTex from "./components/BibTex"
import { BreakDownWrapper } from './Taxon/BreakDownWrapper';
import { DistributionsWrapper } from './Taxon/DistributionsWrapper';
export const Tree = withTheme(withDatasetKey(colTree));
export const Taxon = withTheme(withDatasetKey(taxon));
export const Search = withTheme(withDatasetKey(search));
export const SourceDataset = withTheme(withDatasetKey(sourceDataset));
export const SourceDatasetList = withTheme(withDatasetKey(sourceDatasetList));
export const BibTex = withTheme(withBibTexLegacyShim(bibTex));
export const TaxonBreakdown = withTheme(BreakDownWrapper);
export const TaxonDistribution = withTheme(DistributionsWrapper);
