import withDatasetKey from "../withDatasetKey";
import { withTheme } from "../withTheme";
import sourceDataset from "../SourceDataset";

export const SourceDataset = withTheme(withDatasetKey(sourceDataset));
