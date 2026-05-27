import React, { useState, useEffect } from "react";
import config from "../config";
import axios from "axios";
import Highcharts from "highcharts";
import "highcharts/modules/exporting";
import HighchartsReact from "highcharts-react-official";
import _ from "lodash";
import { Spin, Row, Col } from "antd";
import { useNavigateTo } from "../router";

const MAX_SLICES_PER_RING = 100;
const canonicalRanks = [
  "kingdom",
  "phylum",
  "class",
  "order",
  "family",
  "genus",
  "species",
];

const notAssignedLabel = (rk) => (rk ? `Not assigned ${rk}` : "Not assigned");

const sortAndClip = (nodes) => {
  if (!nodes || nodes.length === 0) return [];
  const sorted = [...nodes].sort((a, b) => (b.species || 0) - (a.species || 0));
  return sorted.length <= MAX_SLICES_PER_RING
    ? sorted
    : sorted.slice(0, MAX_SLICES_PER_RING);
};

// Append a "Not assigned <rank>" slice for the difference between a parent's
// total species count and the sum of its visible children. Covers two cases:
//   1. species that sit directly under the parent without an intermediate rank
//   2. species under children that were clipped out by sortAndClip
const padNotAssigned = (kids, parentSpecies) => {
  const sorted = sortAndClip(kids || []);
  const sum = sorted.reduce((a, n) => a + (n.species || 0), 0);
  if (sum >= parentSpecies) return sorted;
  return [
    ...sorted,
    {
      name: notAssignedLabel(_.get(sorted, "[0].rank", "")),
      species: parentSpecies - sum,
      children: [],
    },
  ];
};

const TaxonBreakdown = ({
  taxon,
  datasetKey,
  rank = [],
  dataset,
  level = 1,
  darkMode,
}) => {
  const navigateToTaxon = useNavigateTo("taxon");
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [taxonID, setTaxonID] = useState(null);
  useEffect(() => {
    if (taxon?.id !== taxonID) {
      getData();
      setTaxonID(taxon?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxon, datasetKey]);

  const getOverView = async () => {
    const res = await axios(
      `${
        config.dataApi
      }dataset/${datasetKey}/nameusage/search?TAXON_ID=${encodeURIComponent(
        taxon.id
      )}&facet=rank&status=accepted&status=provisionally%20accepted&limit=0`
    );
    return _.keyBy(_.get(res, "data.facets.rank", []), "value");
  };

  const getData = async () => {
    setLoading(true);
    try {
      const counts = await getOverView();

      // confirm the focal taxon has at least one child rank with content
      const ranks = canonicalRanks;
      let taxonRankIdx = ranks.indexOf(_.get(taxon, "name.rank"));
      if (taxonRankIdx === -1) {
        let rankIndex = rank.indexOf(_.get(taxon, "name.rank")) + 1;
        while (taxonRankIdx === -1 && rankIndex < rank.length - 1) {
          const canonicalRankIndex = ranks.indexOf(rank[rankIndex]);
          if (canonicalRankIndex > -1) {
            taxonRankIdx = canonicalRankIndex - 1;
          }
          rankIndex++;
        }
      }
      let childRank;
      let childRankIndex = taxonRankIdx + 1;
      while (!childRank && childRankIndex < ranks.length) {
        const nextRank = _.get(ranks, `[${childRankIndex}]`);
        if (nextRank && _.get(counts, `${nextRank}.count`, 0) > 0) {
          childRank = nextRank;
        } else {
          childRankIndex++;
        }
      }
      if (!childRank) {
        setInvalid(true);
        setLoading(false);
        return;
      }

      const res = await axios(
        `${config.dataApi}dataset/${datasetKey}/taxon/${taxon.id}/breakdown?level=${level}`
      );
      const children = res.data || [];
      const totalSpecies = _.get(counts, "species.count", 0);

      setLoading(false);
      buildChart(children, totalSpecies);
    } catch (err) {
      setLoading(false);
    }
  };

  const buildChart = (children, totalSpecies) => {
    const DOI = dataset.doi ? "https://doi.org/" + dataset.doi : null;
    const baseColors = Highcharts.getOptions().colors;
    // Colour used for outer-ring "gap" slices: match the page background so
    // the wedge reads as empty space rather than overlapping the inner pie.
    // Follows the explicit `darkMode` prop if given, otherwise prefers-color-scheme.
    const prefersDark =
      typeof darkMode === "boolean"
        ? darkMode
        : typeof window !== "undefined" &&
          typeof window.matchMedia === "function" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
    const gapColor = prefersDark ? "#1f1f1f" : "#ffffff";
    const taxonClickHandler = {
      click: (e) => {
        if (e.point._id) {
          navigateToTaxon(e.point._id);
        }
      },
    };

    // Inner pie: direct children of the focal taxon. Pad with a single
    // "Not assigned <rank>" slice if focal-taxon species don't fully sum up.
    const innerNodes = padNotAssigned(children, totalSpecies);
    const innerData = innerNodes.map((n, i) => ({
      name: n.name,
      y: n.species,
      _id: n.id,
      color: baseColors[i % baseColors.length],
      _kids: n.children,
    }));

    // Outer ring: children of each inner slice (grandchildren of focal),
    // coloured as a monochrome brightness shift of the parent so each
    // family of arcs reads as one hue group. Only rendered when level >= 2
    // AND the response actually carries that depth. With level=1 we draw
    // a single-ring pie even if the API returned nested children.
    const outerData = [];
    const hasOuterData =
      level >= 2 && innerData.some((s) => s._kids && s._kids.length > 0);
    if (hasOuterData) {
      innerData.forEach((slice) => {
        const sorted = sortAndClip(slice._kids || []);
        const sum = sorted.reduce((a, n) => a + (n.species || 0), 0);
        sorted.forEach((g, j) => {
          const t = sorted.length > 1 ? j / (sorted.length - 1) : 0;
          const shift = -0.1 + t * 0.4;
          outerData.push({
            name: g.name,
            y: g.species,
            _id: g.id,
            color: Highcharts.color(slice.color).brighten(shift).get(),
          });
        });
        // Where children don't fully account for the inner slice, add a
        // transparent gap slice so the outer ring stays angularly aligned
        // with the inner pie but the missing portion reads as empty space
        // (rather than a labelled "Not assigned" wedge).
        if (sum < slice.y) {
          outerData.push({
            name: notAssignedLabel(_.get(sorted, "[0].rank", "")),
            y: slice.y - sum,
            color: gapColor,
            borderColor: gapColor,
            borderWidth: 0,
            dataLabels: { enabled: false },
          });
        }
      });
    }

    const clean = (rows) => rows.map(({ _kids, ...rest }) => rest);
    const grandTotal = totalSpecies || innerData.reduce((a, s) => a + s.y, 0);

    const innerLabelStyle = {
      color: "contrast",
      textOutline: "1px contrast",
      fontWeight: "bold",
    };

    const series = [
      {
        name: "Species",
        data: clean(innerData),
        size: hasOuterData ? "60%" : "85%",
        dataLabels: {
          formatter: function () {
            return this.y > grandTotal / 10 ? this.point.name : null;
          },
          distance: -30,
          style: innerLabelStyle,
        },
        point: { events: taxonClickHandler },
      },
    ];
    if (hasOuterData) {
      series.push({
        name: "Species",
        data: outerData,
        size: "85%",
        innerSize: "60%",
        dataLabels: {
          formatter: function () {
            return this.y > 1
              ? "<b>" +
                  this.point.name +
                  ":</b> " +
                  this.y.toLocaleString("en-GB")
              : null;
          },
        },
        point: { events: taxonClickHandler },
      });
    }

    setOptions({
      chart: { type: "pie" },
      credits: {
        text: `${taxon.name.scientificName} in ${dataset.title}${
          dataset.version ? " (" + dataset.version + ")" : ""
        }. ${(dataset.doi ? "DOI:" + dataset.doi : null) || dataset.url || ""}`,
        href: DOI || dataset.url || "",
      },
      title: { text: "" },
      plotOptions: { pie: { shadow: false, center: ["50%", "50%"] } },
      tooltip: {},
      series,
      responsive: {
        rules: [
          {
            condition: { maxWidth: 400 },
            chartOptions: {
              series: hasOuterData
                ? [{}, { dataLabels: { enabled: false } }]
                : [{}],
            },
          },
        ],
      },
      exporting: {
        chartOptions: {
          plotOptions: { series: { dataLabels: { enabled: true } } },
        },
        fallbackToExportServer: false,
      },
    });
  };

  return invalid ? null : loading || !options ? (
    <Row style={{ padding: "48px" }}>
      <Col flex="auto"></Col>
      <Col>
        <Spin size="large" />
      </Col>
      <Col flex="auto"></Col>
    </Row>
  ) : (
    <HighchartsReact highcharts={Highcharts} options={options} />
  );
};

export default TaxonBreakdown;
