import React from "react";
import _ from "lodash";
import PresentationItem from "../components/PresentationItem";

const typeMap = {
    "spelling correction" : "of",
    "based on" : "",
    "replacement name": "for",
    "later homonym": "of",
    "superfluous": "name for"
}

const NameRelations = ({ data, style }) => {
  return (
    <div style={style}>
      {data
        .map(r => (
          <PresentationItem key={r.key} label={`${_.capitalize(r.type)} ${typeMap[r.type] ? typeMap[r.type]: ""}` } helpText={r.note}>
            <span dangerouslySetInnerHTML={{__html: r.relatedName.labelHtml}}></span>
          </PresentationItem>
        ))}
    </div>
  );
};

export default NameRelations;
