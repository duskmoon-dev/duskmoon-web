import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  formatAxisValue,
  layoutXY,
  mapScene,
  reconcileVizState,
  targetKey,
  transitionViz,
  vizState,
} from "./index.js";
import type {
  MapInput,
  Pair,
  VizAction,
  VizEvent,
  VizState,
  VizTarget,
  XYChartInput,
} from "./index.js";

type FixtureAction =
  | VizAction
  | { type: "focus"; target: Extract<VizTarget, { kind: "datum" }> }
  | { type: "writeSelection"; ids: VizTarget[] };

const contract = new URL(
  "../../../../specs/visualization/v1/",
  import.meta.url,
);
function read<T>(path: string): Record<string, T> {
  return JSON.parse(readFileSync(new URL(path, contract), "utf8"));
}
const fixtures = read<{
  chart: XYChartInput | MapInput;
  actions: FixtureAction[];
  controlled?: string[];
}>("fixtures/interaction.json");
const results = read<{ events: VizEvent[]; finalState?: Partial<VizState> }>(
  "expected/interaction.json",
);

for (const [id, { chart, actions, controlled }] of Object.entries(fixtures)) {
  if (chart.kind !== "line" && chart.kind !== "scatter" && chart.kind !== "map") continue;
  test(id, () => {
    const layout = chart.kind === "map" ? null : layoutXY(chart);
    const initial = vizState({
      viewport:
        chart.kind === "map"
          ? mapScene(chart).initialViewport
          : chart.kind === "line"
            ? { kind: "line", x: layout!.xDomain as Pair }
            : { kind: "scatter", x: layout!.xDomain as Pair, y: layout!.yDomain! },
    });
    const config = {
      initial,
      seriesIds: chart.kind === "map" ? [] : chart.series.map(({ id }) => id),
      selectionMode: chart.options?.selectionMode,
    };
    let state = initial;
    const log: VizEvent[] = [];
    for (const action of actions) {
      if (action.type === "writeSelection") {
        state = { ...state, ids: action.ids };
        continue;
      }
      let normalized: VizAction;
      if (action.type === "focus" && "target" in action) {
        if (chart.kind === "map") throw new Error("Expected an XY focus fixture");
        const { target } = action;
        const datum = chart.series
          .find(({ id }) => id === target.seriesId)!
          .data.find(({ id }) => id === target.datumId)!;
        const unit = chart.yAxis.unit;
        const display =
          formatAxisValue(datum.y!, chart.yAxis) + (unit ? " " + unit : "");
        normalized = {
          type: "focus",
          tooltip: {
            type: "tooltip",
            target,
            raw: { x: datum.x, y: datum.y },
            display,
            unit,
          },
        };
      } else {
        normalized = action;
      }
      const result = transitionViz(state, normalized, config);
      log.push(...result.events);
      state = controlled?.includes("selection")
        ? { ...result.state, ids: state.ids }
        : result.state;
    }
    expect(log).toEqual(results[id].events);
    if (results[id].finalState)
      expect(state).toMatchObject(results[id].finalState!);
  });
}

test("reconciliation preserves selected hidden data and removes only missing identities", () => {
  const first = { kind: "datum", seriesId: "a", datumId: "first" } as const;
  const second = { kind: "datum", seriesId: "a", datumId: "second" } as const;
  const state = {
    ...vizState({ ids: [first, second], hiddenSeriesIds: ["a", "b"] }),
    tooltip: {
      type: "tooltip",
      target: first,
      raw: { y: 0 },
      display: "0",
    } as const,
  };
  expect(
    reconcileVizState(state, new Set(["a"]), new Set([targetKey(first)])),
  ).toEqual({
    ...vizState({ ids: [first], hiddenSeriesIds: ["a"] }),
  });
});
