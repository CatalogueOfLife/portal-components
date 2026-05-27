import React from "react";
import NameSearch from "./NameSearch";
import axios from "axios";
import btoa from "btoa";
import { RouterContext, buildRouter } from "../router";

export default function Search({
  datasetKey,
  filters,
  onFiltersChange,
  defaultTaxonKey,
  citation,
  auth,
  ...routerProps
}) {
  if (auth) {
    axios.defaults.headers.common["Authorization"] = `Basic ${btoa(auth)}`;
  }
  return (
    <RouterContext.Provider value={buildRouter(routerProps)}>
      <NameSearch
        datasetKey={datasetKey}
        filters={filters}
        onFiltersChange={onFiltersChange}
        defaultTaxonKey={defaultTaxonKey}
        citation={citation}
      />
    </RouterContext.Provider>
  );
}
