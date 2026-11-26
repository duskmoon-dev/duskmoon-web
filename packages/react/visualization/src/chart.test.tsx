import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { DmVizBarChart, DmVizHeatmap, DmVizLineChart } from "./index.js";

test("grouped chart keeps a zero bar and a negative bar", () => {
  const markup = renderToStaticMarkup(
    <DmVizBarChart
      width={480}
      chart={{
        kind: "bar",
        xAxis: { type: "category" },
        yAxis: { type: "numeric" },
        series: [
          { id: "a", name: "A", data: [{ id: "negative", x: "Q1", y: -2 }] },
          { id: "b", name: "B", data: [{ id: "zero", x: "Q1", y: 0 }] },
        ],
      }}
    />,
  );
  expect(markup).toContain('data-datum-id="negative"');
  expect(markup).toContain('data-datum-id="zero"');
  expect(markup).toMatch(
    /<rect(?=[^>]*data-datum-id="zero")(?=[^>]*height="0")[^>]*>/,
  );
});

test("a heatmap keeps an explicit missing cell and the empty state", () => {
  const chart = {
    kind: "heatmap" as const,
    rows: [{ id: "r", label: "Row" }],
    columns: [
      { id: "c", label: "Missing" },
      { id: "d", label: "Zero" },
    ],
    cells: [{ id: "missing", rowId: "r", columnId: "c", value: null }],
  };
  expect(
    renderToStaticMarkup(<DmVizHeatmap width={480} chart={chart} />),
  ).toContain("No data to display");
  const markup = renderToStaticMarkup(
    <DmVizHeatmap
      width={480}
      chart={{
        ...chart,
        cells: [
          ...chart.cells,
          { id: "zero", rowId: "r", columnId: "d", value: 0 },
        ],
      }}
    />,
  );
  expect(markup).toContain('data-cell-id="missing"');
  expect(markup).toContain('data-cell-id="zero"');
});

test("invalid data produces an error and empty SSR has no DOM dependency", () => {
  const chart = {
    kind: "line" as const,
    xAxis: { type: "time" as const },
    yAxis: { type: "numeric" as const },
    series: [
      {
        id: "main",
        name: "Main",
        data: [{ id: "p", x: "2026-02-30T15:00:00Z", y: 1 }],
      },
    ],
  };
  expect(renderToStaticMarkup(<DmVizLineChart chart={chart} />)).toContain(
    "Unable to display chart",
  );
  expect(
    renderToStaticMarkup(<DmVizLineChart chart={chart} loading />),
  ).toContain("Loading chart…");
});
