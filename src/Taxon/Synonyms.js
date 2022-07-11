import React from "react";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem"
import ReferencePopover from "./ReferencePopover"
const SynonymsTable = ({ data, style, catalogueKey, references, nomStatus, referenceIndexMap }) => {

  const getNomStatus = (taxon) => !nomStatus ? _.get(taxon, "name.nomStatus") : nomStatus[_.get(taxon, "name.nomStatus")][
    (_.get(taxon, "name.code"), "zoological")
  ]

  return (
    <div style={style}>
      {data
        .map(s => {
          return s[0] ? s[0] : s;
        })
        .map(s => (
          <BorderedListItem key={_.get(s, 'name.id')}>
            <span           
            >
            {_.get(s, '__homotypic') === true ? '≡ ' : '= '}  <span dangerouslySetInnerHTML={{ __html: _.get(s, 'labelHtml') }} /> {_.get(s, 'name.nomStatus') && `(${getNomStatus(s)})`} {_.get(s, 'status') === 'misapplied' && _.get(s, 'accordingTo') ?  _.get(s, 'accordingTo') :''} {_.get(s, "status") === "ambiguous synonym" && "(Ambiguous)"}
            </span> 
            {" "}
              <ReferencePopover references={references} referenceIndexMap={referenceIndexMap} datasetKey={catalogueKey} referenceId={
                _.get(s, "name.publishedInId")
                  ? [_.get(s, "name.publishedInId"), ...(s.referenceIds || [])]
                  : s.referenceIds
              } style={{display: 'inline-block'}} placement="top"/>
          </BorderedListItem>
        ))}
    </div>
  );
};

export default SynonymsTable;
