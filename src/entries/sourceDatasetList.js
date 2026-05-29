import withDatasetKey from "../withDatasetKey";
import { withTheme } from "../withTheme";
import sourceDatasetList from "../SourceDatasetList";

export const SourceDatasetList = withTheme(withDatasetKey(sourceDatasetList));
