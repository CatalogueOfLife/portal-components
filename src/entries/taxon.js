import withDatasetKey from "../withDatasetKey";
import { withTheme } from "../withTheme";
import taxon from "../Taxon";

export const Taxon = withTheme(withDatasetKey(taxon));
