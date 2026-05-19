import { useState } from "react";
import _ from "lodash";
import BorderedListItem from "./BorderedListItem";
import ReferencePopover from "./ReferencePopover";
import MergedDataBadge from "../components/MergedDataBadge";
import DecisionBadge from "../components/DecisionBadge";
import TypeMaterialPopover from "./TypeMaterialPopover";
import ShowMoreToggle from "./ShowMoreToggle";

const TOP_N = 5;

const SynonymsTable = ({
  datasetKey,
  data,
  style,
  nomStatus,
  references,
  decisions,
  typeMaterial,
  referenceIndexMap,
  primarySource,
  pathToDataset,
}) => {
  const [showAll, setShowAll] = useState(false);

  const getNomStatus = (taxon) =>
    !nomStatus
      ? _.get(taxon, "name.nomStatus")
      : nomStatus[_.get(taxon, "name.nomStatus")][
          (_.get(taxon, "name.code"), "zoological")
        ];

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

  // Flatten render order so truncation can count rendered lines exactly.
  // Each item is one BorderedListItem. Heterotypic groups become a leader
  // (homotypic=false, "=") followed by their nested homotypic members
  // (homotypic=true + indent, "≡").
  const items = [];
  if (data.homotypic) {
    [...data.homotypic].sort(sorter).forEach((s) => {
      items.push({ syn: s, homotypic: true, indent: false });
    });
  }
  if (data.heterotypicGroups) {
    [...data.heterotypicGroups]
      .sort((a, b) => sorter(a[0], b[0]))
      .forEach((group) => {
        group.forEach((s, i) => {
          items.push({ syn: s, homotypic: i > 0, indent: i > 0 });
        });
      });
  }

  const total = items.length;
  const visibleItems = showAll ? items : items.slice(0, TOP_N);

  const renderItem = ({ syn: s, homotypic, indent }) => (
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
      </span>{" "}
      {s?.sourceDatasetKey &&
        _.get(primarySource, "key") !== s?.sourceDatasetKey && (
          <MergedDataBadge
            createdBy={s?.createdBy}
            datasetKey={s.datasetKey}
            sourceDatasetKey={s?.sourceDatasetKey}
            pathToDataset={pathToDataset}
            verbatimSourceKey={s.verbatimSourceKey}
          />
        )}{" "}
      {decisions?.[s?.id] && <DecisionBadge decision={decisions?.[s?.id]} />}
      <TypeMaterialPopover
        datasetKey={datasetKey}
        typeMaterial={typeMaterial}
        nameId={_.get(s, "name.id")}
        placement="top"
      />{" "}
      {_.get(s, "name.nomStatus") ? `(${getNomStatus(s)})` : ""}{" "}
      {_.get(s, "status") === "misapplied" && _.get(s, "accordingTo")
        ? _.get(s, "accordingTo")
        : ""}
      {_.get(s, "status") === "ambiguous synonym" && "(Ambiguous)"}
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
        style={{ display: "inline-block" }}
      />
    </BorderedListItem>
  );

  return (
    <div style={style}>
      {visibleItems.map(renderItem)}
      <ShowMoreToggle
        total={total}
        visible={TOP_N}
        showAll={showAll}
        onChange={setShowAll}
      />
    </div>
  );
};

export default SynonymsTable;
