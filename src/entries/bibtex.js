import { withBibTexLegacyShim } from "../withDatasetKey";
import { withTheme } from "../withTheme";
import bibTex from "../components/BibTex";

export const BibTex = withTheme(withBibTexLegacyShim(bibTex));
