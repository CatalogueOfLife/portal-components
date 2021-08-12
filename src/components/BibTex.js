import React from "react";
import config from "../config";

const BibTex = ({ datasetKey, catalogueKey, style = {} }) => {
const defaultStyle = {
    height: "40px"
}
const url = catalogueKey ? `${config.dataApi}dataset/${catalogueKey}/source/${datasetKey}.bib` : `${config.dataApi}dataset/${datasetKey}.bib`

  return (
    <a href={url} >
      <img src="https://data.catalogueoflife.org/images/bibtex_logo.png" style={{...defaultStyle, ...style}} />
    </a>
  );
};

export default BibTex;
