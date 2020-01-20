import React from "react";
import _ from "lodash";
// import { NavLink } from "react-router-dom";
import PresentationItem from "../components/PresentationItem";

const ClassificationTable = ({ data, style,  pathToTree }) => (
  <div style={style}> {_.reverse([...data]).map(t => (
    <PresentationItem md={6} label={_.startCase(t.name.rank)} classes={{formItem: {borderBottom: 'none'}}} key={t.name.rank}>

        <a onClick={() => {window.location.href =  `${pathToTree}?taxonKey=${t.id}`}} dangerouslySetInnerHTML={{ __html: t.labelHtml }} />
      
    </PresentationItem>
  ))} </div>
);

export default ClassificationTable;
