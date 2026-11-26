import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  formatAxisValue,
  layoutHeatmap,
  layoutXY,
  normalizeTime,
  seriesHash,
} from "./index.js";
import type { HeatmapInput, Issue, Pair, Rect, XYChartInput } from "./index.js";

const contract = new URL(
  "../../../../specs/visualization/v1/",
  import.meta.url,
);
function read<T>(
  directory: "fixtures" | "expected",
  group: string,
): Record<string, T> {
  return JSON.parse(
    readFileSync(new URL(`${directory}/${group}.json`, contract), "utf8"),
  );
}

function assertCoordinates<T extends number | readonly number[]>(
  received: Record<string, T>,
  expected: Record<string, T>,
  tolerance: number,
): void {
  expect(Object.keys(received).sort()).toEqual(Object.keys(expected).sort());
  for (const [id, target] of Object.entries(expected)) {
    const actual = [received[id]].flat();
    const values = [target].flat();
    expect(actual).toHaveLength(values.length);
    values.forEach((value, i) =>
      expect(Math.abs(actual[i] - value)).toBeLessThanOrEqual(tolerance),
    );
  }
}

type XYExpected = {
  xDomain: number[] | string[] | null;
  yDomain?: number[] | null;
  xTickValues?: number[];
  state?: string;
  segments?: Record<string, string[][]>;
  drawableDatumIds?: string[];
  clippedDatumIds?: string[];
  geometry?: {
    tolerance: number;
    baseline?: number;
    points?: Record<string, Pair>;
    bars?: Record<string, Rect>;
  };
  hashes?: Record<string, number>;
  seriesColors?: Record<string, string>;
  datumColors?: Record<string, Record<string, string>>;
  hiddenSeriesIds?: string[];
  issues?: Issue[];
  normalizedX?: number[];
  displayX?: string[];
};

for (const group of ["xy", "identity", "time"]) {
  const expected = read<XYExpected>("expected", group);
  for (const [id, { chart }] of Object.entries(
    read<{ chart: XYChartInput }>("fixtures", group),
  )) {
    test(`${group}/${id}`, () => {
      const result = layoutXY(chart);
      const target = expected[id];
      const points = result.series.flatMap((series) => series.points);
      expect(result.state).toBe(target.state ?? "ready");
      expect(result.issues).toEqual(target.issues ?? []);
      expect(result.xDomain).toEqual(target.xDomain);
      if ("yDomain" in target) expect(result.yDomain).toEqual(target.yDomain!);
      if (target.xTickValues) expect(result.xTicks).toEqual(target.xTickValues);
      if (target.segments)
        expect(
          Object.fromEntries(
            result.series.map(({ id, segments }) => [
              id,
              segments.map((segment) => segment.map(({ datum }) => datum.id)),
            ]),
          ),
        ).toEqual(target.segments);
      if (target.drawableDatumIds)
        expect(points.map(({ datum }) => datum.id)).toEqual(
          target.drawableDatumIds,
        );
      if (target.clippedDatumIds) {
        const rendered = new Set(
          points
            .filter(({ point }) =>
              point.every((value) => value >= 0 && value <= 1),
            )
            .map(({ datum }) => datum.id),
        );
        expect(
          chart.series.flatMap(({ data }) =>
            data
              .filter(
                ({ id, x, y }) => x !== null && y !== null && !rendered.has(id),
              )
              .map(({ id }) => id),
          ),
        ).toEqual(target.clippedDatumIds);
      }
      if (target.geometry) {
        const {
          tolerance,
          points: expectedPoints,
          bars,
          baseline,
        } = target.geometry;
        if (baseline !== undefined)
          expect(Math.abs(result.baseline! - baseline)).toBeLessThanOrEqual(
            tolerance,
          );
        if (expectedPoints)
          assertCoordinates(
            Object.fromEntries(
              points.map(({ datum, point }) => [datum.id, point]),
            ),
            expectedPoints,
            tolerance,
          );
        if (bars)
          assertCoordinates(
            Object.fromEntries(
              points.map(({ datum, rect }) => [datum.id, rect!]),
            ),
            bars,
            tolerance,
          );
      }
      if (target.hiddenSeriesIds)
        expect(
          result.series.filter(({ visible }) => !visible).map(({ id }) => id),
        ).toEqual(target.hiddenSeriesIds);
      if (target.hashes)
        for (const [id, hash] of Object.entries(target.hashes))
          expect(seriesHash(id)).toBe(hash);
      if (target.seriesColors)
        expect(
          Object.fromEntries(result.series.map(({ id, color }) => [id, color])),
        ).toEqual(target.seriesColors);
      for (const [seriesId, colors] of Object.entries(
        target.datumColors ?? {},
      )) {
        const series = result.series.find(({ id }) => id === seriesId)!;
        expect(
          Object.fromEntries(
            series.points.map(({ datum, color }) => [datum.id, color]),
          ),
        ).toEqual(colors);
      }
      if (target.normalizedX) {
        const normalized = chart.series[0].data.map(({ x }) =>
          normalizeTime(x!)!,
        );
        expect(normalized).toEqual(target.normalizedX);
        expect(normalized.map((x) => formatAxisValue(x, chart.xAxis))).toEqual(
          target.displayX!,
        );
      }
    });
  }
}

type HeatmapExpected = {
  valueDomain: Pair;
  cellColors: Record<string, string>;
  absent?: { rowId: string; columnId: string; color: string }[];
  geometry?: { tolerance: number; cells: Record<string, Rect> };
};
const heatmapExpected = read<HeatmapExpected>("expected", "heatmap");
for (const [id, { chart }] of Object.entries(
  read<{ chart: HeatmapInput }>("fixtures", "heatmap"),
)) {
  test(`heatmap/${id}`, () => {
    const result = layoutHeatmap(chart);
    const target = heatmapExpected[id];
    expect(result.state).toBe("ready");
    expect(result.issues).toEqual([]);
    expect(result.valueDomain).toEqual(target.valueDomain);
    const present = result.cells.filter(({ cell }) => cell);
    expect(
      Object.fromEntries(present.map(({ cell, color }) => [cell!.id, color])),
    ).toEqual(target.cellColors);
    if (target.absent)
      expect(
        result.cells
          .filter(({ cell }) => !cell)
          .map(({ rowId, columnId, color }) => ({ rowId, columnId, color })),
      ).toEqual(target.absent);
    if (target.geometry)
      assertCoordinates(
        Object.fromEntries(present.map(({ cell, rect }) => [cell!.id, rect])),
        target.geometry.cells,
        target.geometry.tolerance,
      );
  });
}

type InvalidFixture = {
  chart: XYChartInput | HeatmapInput | { kind: "network" | "map" };
  mutations: { path: string; value: unknown }[];
};
const invalidExpected = read<{ issues: Issue[] }>("expected", "validation");
for (const [id, { chart, mutations }] of Object.entries(
  read<InvalidFixture>("fixtures", "validation"),
)) {
  if (chart.kind === "map" || chart.kind === "network") continue;
  test(`validation/${id}`, () => {
    for (const { path, value } of mutations) {
      const parts = path.slice(1).split("/");
      let parent = chart as unknown as Record<string, unknown>;
      for (const part of parts.slice(0, -1))
        parent = parent[part] as Record<string, unknown>;
      parent[parts.at(-1)!] =
        value && typeof value === "object" && "nativeNumber" in value
          ? Number(value.nativeNumber)
          : value;
    }
    const result =
      chart.kind === "heatmap"
        ? layoutHeatmap(chart)
        : layoutXY(chart as XYChartInput);
    expect(result.state).toBe("error");
    expect(result.issues).toEqual(invalidExpected[id].issues);
  });
}
