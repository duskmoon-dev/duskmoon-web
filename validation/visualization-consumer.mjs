import { createElement as h, useState } from "react";
import {
  DmVizBarChart,
  DmVizHeatmap,
  DmVizLineChart,
  DmVizNetworkGraph,
  DmVizMapChart,
  DmVizScatterChart,
} from "@duskmoon-dev/visualization";

function NetworkExample({ chart, width, onEvent }) {
  const [viewport, setViewport] = useState({
    kind: "network",
    center: [5, 5],
    zoom: 0.75,
  });
  return h(DmVizNetworkGraph, {
    chart,
    width,
    viewport,
    onEvent(event) {
      if (event.type === "viewport") setViewport(event.viewport);
      onEvent?.(event);
    },
  });
}

export function examples(fixtures, width, onEvent) {
  const chart = (group, id, title) => {
    const input = fixtures[group][id].chart;
    return { ...input, options: { ...input.options, title } };
  };
  return h(
    "main",
    { style: { width: 480 } },
    h(DmVizLineChart, {
      width,
      onEvent,
      chart: chart("xy", "line-input-order-gap-and-repeated-x", "Gapped line"),
    }),
    h(DmVizBarChart, {
      width,
      onEvent,
      chart: chart("xy", "bar-grouped-vertical", "Grouped bars"),
    }),
    h(DmVizScatterChart, {
      width,
      onEvent,
      chart: chart("xy", "scatter-missing", "Missing coordinates"),
    }),
    h(DmVizHeatmap, {
      width,
      onEvent,
      chart: chart(
        "heatmap",
        "ordered-continuous-and-missing",
        "Ordered heatmap",
      ),
    }),
    h(NetworkExample, {
      width,
      onEvent,
      chart: chart("scenes", "network-fixed", "Fixed network"),
    }),
    h(DmVizMapChart, {
      width,
      onEvent,
      chart: chart("scenes", "mercator-fit-holes-and-points", "Mercator map"),
    }),
  );
}
