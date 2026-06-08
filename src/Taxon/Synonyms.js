import { useState } from "react";
import { get } from "lodash-es";
import BorderedListItem from "./BorderedListItem";
import ReferencePopover from "./ReferencePopover";
import MergedDataBadge from "../components/MergedDataBadge";
import DecisionBadge from "../components/DecisionBadge";
import TypeMaterialPopover from "./TypeMaterialPopover";
import ShowMoreToggle from "./ShowMoreToggle";
import { LinkTo } from "../router";

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
}) => {
  const [showAll, setShowAll] = useState(false);

  const getNomStatus = (taxon) =>
    !nomStatus
      ? get(taxon, "name.nomStatus")
      : nomStatus[get(taxon, "name.nomStatus")][
          (get(taxon, "name.code"), "zoological")
        ];

  const sorter = (a, b) => {
    if (
      get(a, "name.combinationAuthorship.year") &&
      get(b, "name.combinationAuthorship.year")
    ) {
      return (
        get(b, "name.combinationAuthorship.year") -
        get(a, "name.combinationAuthorship.year")
      );
    } else {
      if (get(a, "name.scientificName") < get(b, "name.scientificName")) {
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
    <BorderedListItem key={get(s, "name.id")}>
      <span style={indent ? { marginLeft: "10px" } : null}>
        {homotypic === true ? "≡ " : "= "}{" "}
        <LinkTo to="taxon" args={get(s, "id")}>
          <span
            dangerouslySetInnerHTML={{
              __html: get(
                s,
                "labelHtml",
                `${get(s, "name.scientificName")} ${get(
                  s,
                  "name.authorship",
                  ""
                )}`
              ),
            }}
          />
        </LinkTo>
      </span>{" "}
      {s?.sourceDatasetKey &&
        get(primarySource, "key") !== s?.sourceDatasetKey && (
          <MergedDataBadge
            createdBy={s?.createdBy}
            datasetKey={s.datasetKey}
            sourceDatasetKey={s?.sourceDatasetKey}
            verbatimSourceKey={s.verbatimSourceKey}
          />
        )}{" "}
      {decisions?.[s?.id] && <DecisionBadge decision={decisions?.[s?.id]} />}
      <TypeMaterialPopover
        datasetKey={datasetKey}
        typeMaterial={typeMaterial}
        nameId={get(s, "name.id")}
        placement="top"
      />{" "}
      {get(s, "name.nomStatus") ? `(${getNomStatus(s)})` : ""}{" "}
      {get(s, "status") === "misapplied" && get(s, "accordingTo")
        ? get(s, "accordingTo")
        : ""}
      {get(s, "status") === "ambiguous synonym" && "(Ambiguous)"}
      <ReferencePopover
        datasetKey={datasetKey}
        references={references}
        referenceIndexMap={referenceIndexMap}
        referenceId={
          get(s, "name.publishedInId")
            ? [get(s, "name.publishedInId"), ...(s.referenceIds || [])]
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
