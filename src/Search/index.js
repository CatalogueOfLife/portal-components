
import React from "react";
import { unstable_HistoryRouter as HistoryRouter } from "react-router-dom";
import history from "../history";
import NameSearch from "./NameSearch";
import axios from "axios";
import btoa from "btoa"

export default   ({datasetKey, pathToTaxon, defaultTaxonKey, citation, auth}) => {
  if(auth){
    
      axios.defaults.headers.common['Authorization'] = `Basic ${btoa(auth)}`;
    
  }
  return  <HistoryRouter history={history}>

                <NameSearch datasetKey={datasetKey} pathToTaxon={pathToTaxon} defaultTaxonKey={defaultTaxonKey} citation={citation}/>

          </HistoryRouter>
}