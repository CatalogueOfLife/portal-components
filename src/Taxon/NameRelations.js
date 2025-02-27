import React from "react";
import PresentationItem from "../components/PresentationItem";
import _ from "lodash";

const getLabel = (r, reverse) => {
  if (!reverse) {
    // return `${_.capitalize(r.type)} ${typeMap[r.type] ? typeMap[r.type] : ""}`;
    switch (r.type) {
      case "spelling correction":
        return "Spelling correction of";
      case "based on":
        return "Based on";
      case "replacement name":
        return "Replacement name of";
      case "later homonym":
        return "Later homonym of";
      case "superfluous":
        return "Superfluous name for";
      case "basionym":
        return "Basionym";
      case "type":
        return "Type";
      default:
        return _.capitalize(r.type);
    }
  } else {
    switch (r.type) {
      case "spelling correction":
        return "Has spelling correction";
      case "based on":
        return "Other name based on this";
      case "replacement name":
        return "Replaced by";
      case "later homonym":
        return "Has later homonym";
      case "superfluous":
        return "Has superfluous name";
      case "basionym":
        return "Basionym of";
      case "type":
        return "Type of";
      default:
        return _.capitalize(r.type);
    }
  }
};



const NameRelations = ({ data,  md, reverse }) =>
  data.map((r, idx) => {
   
    return (
      <PresentationItem
        md={md}
        key={idx}
        label={getLabel(r, reverse)}
        helpText={r.note}
      >

          {/*<span dangerouslySetInnerHTML={{ __html: r.relatedName.labelHtml }}></span> */}
          {!reverse && (
            <span
              dangerouslySetInnerHTML={{
                __html: r.relatedName.labelHtml,
              }}
            />
          )}
          {reverse && (
            <span
              dangerouslySetInnerHTML={{
                __html: r.name.labelHtml,
              }}
            />
          )}
      </PresentationItem>
    );
  });

export default NameRelations;

