import React from "react";
import NameSearch from "./NameSearch";
import client, { setAuth } from "../api/client";
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
  setAuth(auth);
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
