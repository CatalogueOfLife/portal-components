import React, { useState, useEffect } from "react";
import config from "../config";
import axios from "axios";
import Highcharts from "highcharts";
import "highcharts/modules/exporting";
import HighchartsReact from "highcharts-react-official";
import _ from "lodash";
import { Spin, Row, Col } from "antd";

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
  pathToTaxon,
  dataset,
  level = 1,
}) => {
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
      buildChart(children, totalSpecies, level);
    } catch (err) {
      setLoading(false);
    }
  };

  const buildChart = (children, totalSpecies, depth) => {
    const DOI = dataset.doi ? "https://doi.org/" + dataset.doi : null;
    const baseColors = Highcharts.getOptions().colors;
    const navigateToTaxon = {
      click: (e) => {
        if (e.point._id) {
          window.location.href = `${pathToTaxon}${e.point._id}`;
        }
      },
    };

    // Inner ring: direct children of the focal taxon. Pad with a single
    // "Not assigned <rank>" slice if focal-taxon species don't fully sum up.
    const innerNodes = padNotAssigned(children, totalSpecies);
    const innerData = innerNodes.map((n, i) => ({
      name: n.name,
      y: n.species,
      _id: n.id,
      color: baseColors[i % baseColors.length],
      _kids: n.children,
    }));

    // Middle ring: children of each inner slice. Color is a monochrome
    // brightness shift of the parent so the family of arcs visually groups.
    const middleData = [];
    innerData.forEach((slice) => {
      const ring = padNotAssigned(slice._kids, slice.y);
      ring.forEach((g, j) => {
        const t = ring.length > 1 ? j / (ring.length - 1) : 0;
        const shift = -0.1 + t * 0.4;
        middleData.push({
          name: g.name,
          y: g.species,
          _id: g.id,
          color: Highcharts.color(slice.color).brighten(shift).get(),
          _parentColor: slice.color,
          _kids: g.children,
        });
      });
    });

    // Outer ring (level=2 only): one further level down, again monochrome
    // relative to the *inner* ancestor so each family stays one hue.
    const outerData = [];
    if (depth >= 2) {
      middleData.forEach((slice) => {
        const ring = padNotAssigned(slice._kids, slice.y);
        ring.forEach((g, j) => {
          const t = ring.length > 1 ? j / (ring.length - 1) : 0;
          const shift = -0.05 + t * 0.2;
          outerData.push({
            name: g.name,
            y: g.species,
            _id: g.id,
            color: Highcharts.color(slice._parentColor).brighten(shift).get(),
          });
        });
      });
    }

    const clean = (rows) =>
      rows.map(({ _kids, _parentColor, ...rest }) => rest);

    const grandTotal = totalSpecies || innerData.reduce((a, s) => a + s.y, 0);

    const innerLabelStyle = {
      color: "contrast",
      textOutline: "1px contrast",
      fontWeight: "bold",
    };

    const series = [];
    if (depth >= 2) {
      // 3-ring layout. Inner labels live inside the ring so they don't
      // collide with the outer ring's external labels.
      series.push({
        name: "Species",
        data: clean(innerData),
        size: "45%",
        dataLabels: {
          formatter: function () {
            return this.y > grandTotal / 15 ? this.point.name : null;
          },
          distance: -25,
          style: innerLabelStyle,
        },
        point: { events: navigateToTaxon },
      });
      series.push({
        name: "Species",
        data: clean(middleData),
        size: "70%",
        innerSize: "45%",
        dataLabels: {
          formatter: function () {
            return this.y > grandTotal / 60 ? this.point.name : null;
          },
        },
        point: { events: navigateToTaxon },
      });
      series.push({
        name: "Species",
        data: clean(outerData),
        size: "95%",
        innerSize: "70%",
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
        point: { events: navigateToTaxon },
      });
    } else {
      // 2-ring (level=1) layout.
      series.push({
        name: "Species",
        data: clean(innerData),
        size: "60%",
        dataLabels: {
          formatter: function () {
            return this.y > grandTotal / 10 ? this.point.name : null;
          },
          distance: -30,
          style: innerLabelStyle,
        },
        point: { events: navigateToTaxon },
      });
      series.push({
        name: "Species",
        data: clean(middleData),
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
        point: { events: navigateToTaxon },
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
              series:
                depth >= 2
                  ? [
                      {},
                      { dataLabels: { enabled: false } },
                      { dataLabels: { enabled: false } },
                    ]
                  : [{}, { dataLabels: { enabled: false } }],
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
