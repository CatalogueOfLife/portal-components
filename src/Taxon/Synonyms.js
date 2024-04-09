import React, { useState, useEffect } from "react";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem";
import ReferencePopover from "./ReferencePopover";
import { Button } from "antd";
import MergedDataBadge from "../components/MergedDataBadge";

// import TypeMaterialPopover from "./TypeMaterialPopover";


const SynonymsTable = ({
  catalogueKey: datasetKey,
  data,
  style,
  nomStatus,
  references,
  typeMaterial,
  referenceIndexMap,
  primarySource
}) => {
  useEffect(() => {}, [data, primarySource]);

  const getNomStatus = (taxon) => !nomStatus ? _.get(taxon, "name.nomStatus") : nomStatus[_.get(taxon, "name.nomStatus")][
    (_.get(taxon, "name.code"), "zoological")
  ]
  const sorter = (a, b) => {
    if (
      _.get(a, "name.combinationAuthorship.year") &&
      _.get(b, "name.combinationAuthorship.year")
    ) {
      return (
        _.get(b, "name.combinationAuthorship.year") -
        _.get(a, "name.combinationAuthorship.year")
      );
    } else {
      if (_.get(a, "name.scientificName") < _.get(b, "name.scientificName")) {
        return -1;
      } else {
        return 1;
      }
    }
  };

  const renderSynonym = (syn, homotypic, indent) => {
    const s = _.isArray(syn) ? syn[0] : syn;
    const isGroup = _.isArray(syn);
    return (
      <>
        <BorderedListItem key={_.get(s, "name.id")}>
          
            <span style={indent ? { marginLeft: "10px" } : null}>
              {homotypic === true ? "≡ " : "= "}{" "}
              <span
                dangerouslySetInnerHTML={{
                  __html: _.get(
                    s,
                    "labelHtml",
                    `${_.get(s, "name.scientificName")} ${_.get(
                      s,
                      "name.authorship",
                      ""
                    )}`
                  ),
                }}
              />
            </span>
          {" "}
          <>
          {s?.sourceDatasetKey &&
              _.get(primarySource, "key") !== s?.sourceDatasetKey && (
                <MergedDataBadge />
              )}{" "}
            {_.get(s, "name.nomStatus") ? `(${getNomStatus(s)})` : ""}{" "}
            {_.get(s, "status") === "misapplied" && _.get(s, "accordingTo")
              ? _.get(s, "accordingTo")
              : ""}
            {_.get(s, "status") === "ambiguous synonym" && "(Ambiguous)"}
          </>
          
          <ReferencePopover
            datasetKey={datasetKey}
            references={references}
            referenceIndexMap={referenceIndexMap}
            referenceId={
              _.get(s, "name.publishedInId")
                ? [_.get(s, "name.publishedInId"), ...(s.referenceIds || [])]
                : s.referenceIds
            }
            placement="top"
            style={{display: 'inline-block'}} 
          />
         {/*  <TypeMaterialPopover
            datasetKey={datasetKey}
            typeMaterial={typeMaterial}
            nameId={_.get(s, "name.id")}
            placement="top"
          /> */}
          {s?.sourceDatasetKey &&
            _.get(primarySource, "key") !== s?.sourceDatasetKey && (
              <>
                {" "}
                <a
                  className="col-reference-link"
                  href={`#col-sourcedataset-${s?.sourceDatasetKey}`}
                >{`[source: ${s?.sourceDatasetKey}]`}</a>
              </>
            )}
        </BorderedListItem>
        {isGroup &&
          syn.length > 1 &&
          syn.slice(1).map((sg) => renderSynonym(sg, true, true))}
      </>
    );
  };

  return (
    <div style={style}>
      
      {data.homotypic &&
        data.homotypic.sort(sorter).map((s) => renderSynonym(s, true))}
      {data.heterotypicGroups &&
        data.heterotypicGroups
          .sort((a, b) => sorter(a[0], b[0]))
          .map((s) => renderSynonym(s, false))}
    </div>
  );
};

export default SynonymsTable
