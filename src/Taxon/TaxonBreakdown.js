import React, { useState, useEffect } from "react";
import config from "../config";
import client from "../api/client";
import Highcharts from "highcharts";
import "highcharts/modules/exporting";
import HighchartsReact from "highcharts-react-official";
import { get, startCase } from "lodash-es";
import { Spin, Row, Col, Switch } from "antd";
import { useNavigateTo } from "../router";
import { readSetting, writeSetting } from "../storage";

const BREAKDOWN_LEVEL_KEY = "breakdown-level";

const MAX_SLICES_PER_RING = 100;

const notAssignedLabel = (rk) => (rk ? `Not assigned ${rk}` : "Not assigned");

// The breakdown endpoint returns the nodes of a ring plus at most one
// remainder node without an id for the parent's counted descendants placed in
// no node of the ring. Sort the named nodes, clip them to MAX_SLICES_PER_RING
// and fold whatever the clipped nodes and the remainder held into a single
// "Not assigned <rank>" slice, so the ring always adds up to the parent.
const ringNodes = (nodes, parentCount) => {
  const named = (nodes || [])
    .filter((n) => n.id)
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, MAX_SLICES_PER_RING);
  const sum = named.reduce((a, n) => a + (n.count || 0), 0);
  const rank = get(nodes, "[0].rank", "");
  return sum < parentCount
    ? [
        ...named,
        { name: notAssignedLabel(rank), count: parentCount - sum, children: [] },
      ]
    : named;
};

const TaxonBreakdown = ({
  taxon,
  datasetKey,
  dataset,
  level = 1,
  showLevelSwitch = false,
  darkMode,
}) => {
  const navigateToTaxon = useNavigateTo("taxon");
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [invalid, setInvalid] = useState(false);
  // The chart's effective level is controlled internally when the switch
  // is enabled, so toggling can refetch + re-render the chart. Otherwise
  // the prop drives directly.
  const [activeLevel, setActiveLevel] = useState(() =>
    showLevelSwitch ? readSetting(BREAKDOWN_LEVEL_KEY, level) : level
  );
  useEffect(() => {
    // When the 1/2 switch is shown the remembered choice owns the level, so a
    // (usually static) `level` prop must not clobber it; otherwise the prop
    // drives directly.
    if (!showLevelSwitch) setActiveLevel(level);
  }, [level, showLevelSwitch]);
  useEffect(() => {
    if (showLevelSwitch) writeSetting(BREAKDOWN_LEVEL_KEY, activeLevel);
  }, [activeLevel, showLevelSwitch]);
  useEffect(() => {
    if (taxon?.id && datasetKey) {
      getData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taxon, datasetKey, activeLevel]);

  // The backend decides what to count (species, or genera where they
  // outnumber species), which ranks form the rings and the total; the switch
  // only caps the rings at one or two.
  const getData = async () => {
    setLoading(true);
    try {
      const res = await client(
        `${config.dataApi}dataset/${datasetKey}/taxon/${encodeURIComponent(
          taxon.id
        )}/breakdown?level=${activeLevel}`
      );
      const bd = res.data || {};
      setLoading(false);
      if (!bd.countRank || !bd.children || bd.children.length === 0) {
        setInvalid(true);
        return;
      }
      setInvalid(false);
      buildChart(bd);
    } catch (err) {
      setLoading(false);
      setInvalid(true);
    }
  };

  const buildChart = ({ children, total, countRank }) => {
    const seriesName = startCase(countRank === "genus" ? "genera" : countRank);
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

    // Inner pie: direct children of the focal taxon, with a single
    // "Not assigned <rank>" slice for what they do not hold.
    const innerNodes = ringNodes(children, total);
    const innerData = innerNodes.map((n, i) => ({
      name: n.name,
      y: n.count,
      _id: n.id,
      color: baseColors[i % baseColors.length],
      _kids: n.children,
    }));

    // Outer ring: children of each inner slice (grandchildren of focal),
    // coloured as a monochrome brightness shift of the parent so each
    // family of arcs reads as one hue group. Only rendered when the response
    // carries that depth, which it does for level=2 unless the backend
    // decided a second ring is not worth drawing.
    const outerData = [];
    const hasOuterData = innerData.some((s) => s._kids && s._kids.length > 0);
    if (hasOuterData) {
      innerData.forEach((slice) => {
        const sorted = (slice._kids || [])
          .filter((n) => n.id)
          .sort((a, b) => (b.count || 0) - (a.count || 0))
          .slice(0, MAX_SLICES_PER_RING);
        const sum = sorted.reduce((a, n) => a + (n.count || 0), 0);
        sorted.forEach((g, j) => {
          const t = sorted.length > 1 ? j / (sorted.length - 1) : 0;
          const shift = -0.1 + t * 0.4;
          outerData.push({
            name: g.name,
            y: g.count,
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
            name: notAssignedLabel(get(slice._kids, "[0].rank", "")),
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
    const grandTotal = total || innerData.reduce((a, s) => a + s.y, 0);

    const innerLabelStyle = {
      color: "contrast",
      textOutline: "1px contrast",
      fontWeight: "bold",
    };

    // Inner-ring data labels: only positioned inside the ring when there's
    // an outer ring fighting for the external label gutter. With just one
    // ring (level=1) the labels live outside the chart, same as the outer
    // ring at level=2, with the slice name + species count.
    const innerDataLabels = hasOuterData
      ? {
          formatter: function () {
            return this.y > grandTotal / 10 ? this.point.name : null;
          },
          distance: -30,
          style: innerLabelStyle,
        }
      : {
          formatter: function () {
            return this.y > 0
              ? "<b>" +
                  this.point.name +
                  ":</b> " +
                  this.y.toLocaleString("en-GB")
              : null;
          },
        };

    const series = [
      {
        name: seriesName,
        data: clean(innerData),
        size: hasOuterData ? "60%" : "85%",
        dataLabels: innerDataLabels,
        point: { events: taxonClickHandler },
      },
    ];
    if (hasOuterData) {
      series.push({
        name: seriesName,
        data: outerData,
        size: "85%",
        innerSize: "60%",
        dataLabels: {
          formatter: function () {
            return this.y > 0
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

  if (invalid) return null;

  // Place the level toggle inside the chart's top-right area, just left of
  // the Highcharts context-menu (≡) icon, so it doesn't consume an extra
  // row. Colourless switch with lvl1 / lvl2 labels.
  const levelSwitch = showLevelSwitch ? (
    <Switch
      size="small"
      checked={activeLevel === 2}
      onChange={(checked) => setActiveLevel(checked ? 2 : 1)}
      checkedChildren="lvl2"
      unCheckedChildren="lvl1"
      style={{
        position: "absolute",
        top: 11,
        right: 44,
        zIndex: 2,
        background: activeLevel === 2 ? "#8c8c8c" : "#bfbfbf",
      }}
    />
  ) : null;

  return (
    <div style={{ position: "relative" }}>
      {levelSwitch}
      {loading || !options ? (
        <Row style={{ padding: "48px" }}>
          <Col flex="auto"></Col>
          <Col>
            <Spin size="large" />
          </Col>
          <Col flex="auto"></Col>
        </Row>
      ) : (
        <HighchartsReact highcharts={Highcharts} options={options} />
      )}
    </div>
  );
};

export default TaxonBreakdown;
