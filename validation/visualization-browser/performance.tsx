import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import {
  DmVizHeatmap,
  DmVizLineChart,
  DmVizMapChart,
  DmVizNetworkGraph,
  DmVizScatterChart,
} from "@duskmoon-dev/visualization";
import type { MapInput, VizEvent } from "@duskmoon-dev/visualization";
import scenes from "../../specs/visualization/v1/fixtures/scenes.json";

const numeric = { type: "numeric" } as const;
const line = Array.from({ length: 4 }, (_, series) => ({
  id: "s" + series,
  name: "Series " + series,
  data: Array.from({ length: 1_000 }, (_, i) => ({
    id: "p" + i,
    x: i,
    y: series * 2 + Math.sin(i * 0.03),
  })),
}));
const scatter = [
  {
    id: "points",
    name: "Points",
    data: Array.from({ length: 10_000 }, (_, i) => ({
      id: "p" + i,
      x: i % 100,
      y: Math.floor(i / 100),
    })),
  },
];
const categories = Array.from({ length: 100 }, (_, i) => ({
  id: "c" + i,
  label: String(i),
}));
const cells = categories.flatMap((row, y) =>
  categories.map((column, x) => ({
    id: y * 100 + x + "",
    rowId: row.id,
    columnId: column.id,
    value: (x + 7 * y) % 101,
  })),
);
const nodes = Array.from({ length: 500 }, (_, i) => ({
  id: "n" + i,
  x: i % 25,
  y: Math.floor(i / 25),
}));
const edges = Array.from({ length: 1000 }, (_, i) => ({
  id: "e" + i,
  source: "n" + (i % 500),
  target: "n" + ((i + (i < 500 ? 1 : 25)) % 500),
}));
const map = scenes["mercator-fit-holes-and-points"]
  .chart as unknown as MapInput;

function props(onEvent: (event: VizEvent) => void) {
  return { width: 640, height: 360, onEvent };
}
const workloads = {
  line: (revision: number, onEvent: (event: VizEvent) => void) => (
    <DmVizLineChart
      {...props(onEvent)}
      chart={{
        kind: "line",
        xAxis: numeric,
        yAxis: numeric,
        series: line,
        options: { revision, title: "Line " + revision },
      }}
    />
  ),
  scatter: (revision: number, onEvent: (event: VizEvent) => void) => (
    <DmVizScatterChart
      {...props(onEvent)}
      chart={{
        kind: "scatter",
        xAxis: numeric,
        yAxis: numeric,
        series: scatter,
        options: { revision, title: "Scatter " + revision },
      }}
    />
  ),
  heatmap: (revision: number, onEvent: (event: VizEvent) => void) => (
    <DmVizHeatmap
      {...props(onEvent)}
      chart={{
        kind: "heatmap",
        rows: categories,
        columns: categories,
        cells,
        options: { revision, title: "Heatmap " + revision },
      }}
    />
  ),
  network: (revision: number, onEvent: (event: VizEvent) => void) => (
    <DmVizNetworkGraph
      {...props(onEvent)}
      chart={{
        kind: "network",
        nodes,
        edges,
        options: { revision, title: "Network " + revision },
      }}
    />
  ),
  map: (revision: number, onEvent: (event: VizEvent) => void) => (
    <DmVizMapChart
      {...props(onEvent)}
      chart={{
        ...map,
        options: { ...map.options, revision, title: "Map " + revision },
      }}
    />
  ),
};

const frame = () =>
  new Promise<number>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  );
async function run() {
  const root = createRoot(document.getElementById("chart")!);
  const results: Record<
    string,
    {
      firstCommitMs: number;
      updateCommitMs: number;
      inspectCallbackMs: number;
    }[]
  > = {};
  for (const [name, chart] of Object.entries(workloads)) {
    results[name] = [];
    for (let sample = 0; sample < 6; sample++) {
      let inspectionAt = NaN;
      const event = (event: VizEvent) => {
        if (event.type === "tooltip") inspectionAt = performance.now();
      };
      flushSync(() => root.render(null));
      await frame();
      let start = performance.now();
      flushSync(() => root.render(chart(0, event)));
      const firstCommitMs = performance.now() - start;
      await frame();
      start = performance.now();
      flushSync(() => root.render(chart(1, event)));
      const updateCommitMs = performance.now() - start;
      await frame();
      const plot = document.querySelector("[data-plot-interaction]")!;
      start = performance.now();
      plot.dispatchEvent(
        new KeyboardEvent("keydown", { key: "End", bubbles: true }),
      );
      await frame();
      if (!Number.isFinite(inspectionAt))
        throw new Error("Missing inspection callback for " + name);
      if (sample > 0)
        results[name].push({
          firstCommitMs,
          updateCommitMs,
          inspectCallbackMs: inspectionAt - start,
        });
    }
  }
  root.unmount();
  return results;
}

Object.assign(window, { visualizationBenchmark: run() });
