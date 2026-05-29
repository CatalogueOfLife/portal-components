import withDatasetKey from "../withDatasetKey";
import { withTheme } from "../withTheme";
import search from "../Search";

export const Search = withTheme(withDatasetKey(search));
