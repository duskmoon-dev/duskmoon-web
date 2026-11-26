import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import {
  fitScene,
  hitMap,
  mapScene,
  networkScene,
  projectMercator,
  sceneTransform,
  transitionViz,
  vizState,
} from "./index.js";
import type {
  MapInput,
  NetworkInput,
  Pair,
  VizEvent,
  VizViewport,
} from "./index.js";

const base = new URL("../../../../specs/visualization/v1/", import.meta.url);
function read<T>(path: string): Record<string, T> {
  return JSON.parse(readFileSync(new URL(path, base), "utf8"));
}
const fixtures = read<{
  chart: NetworkInput | MapInput;
  plotSize: Pair;
  hitLocations?: Pair[];
}>("fixtures/scenes.json");
const results = read<{
  geometry: {
    tolerance: number;
    nodes?: Record<string, Pair>;
    edges?: Record<string, [Pair, Pair]>;
    points?: Record<string, Pair>;
    outerTop?: number;
    outerBottom?: number;
  };
  viewport: VizViewport;
  hitIds?: (string | null)[];
}>("expected/scenes.json");
const near = (actual: Pair, expected: Pair, tolerance: number) =>
  actual.forEach((value, index) =>
    expect(Math.abs(value - expected[index])).toBeLessThanOrEqual(tolerance),
  );

for (const [id, fixture] of Object.entries(fixtures)) {
  test(id, () => {
    const chart = fixture.chart;
    const target = results[id];
    const { geometry } = target;
    const [width, height] = fixture.plotSize;
    const normalize = ([x, y]: Pair): Pair => [x / width, y / height];
    if (chart.kind === "network") {
      const scene = networkScene(chart);
      expect(scene.issues).toEqual([]);
      expect(scene.initialViewport).toEqual(target.viewport);
      const fit = fitScene(
        scene.bounds!,
        scene.initialViewport!,
        width,
        height,
      )!;
      const { forward } = sceneTransform(
        fit,
        scene.initialViewport!,
        width,
        height,
      );
      const plotted = new Map(
        [...scene.nodes].map(([id, node]) => [
          id,
          normalize(forward([node.x, node.y])),
        ]),
      );
      for (const [id, point] of Object.entries(geometry.nodes!))
        near(plotted.get(id)!, point, geometry.tolerance);
      for (const { id, source, target } of scene.edges) {
        near(plotted.get(source)!, geometry.edges![id][0], geometry.tolerance);
        near(plotted.get(target)!, geometry.edges![id][1], geometry.tolerance);
      }
    } else {
      const scene = mapScene(chart);
      expect(scene.issues).toEqual([]);
      near(
        scene.initialViewport!.center,
        (target.viewport as typeof scene.initialViewport & { center: Pair })
          .center,
        geometry.tolerance,
      );
      const fit = fitScene(
        scene.bounds!,
        scene.initialViewport!,
        width,
        height,
        chart.options?.padding,
      )!;
      const { forward, inverse, scale } = sceneTransform(
        fit,
        scene.initialViewport!,
        width,
        height,
      );
      for (const [id, point] of Object.entries(geometry.points!)) {
        near(
          normalize(
            forward(
              scene.features.find(({ source }) => source.id === id)!.point!,
            ),
          ),
          point,
          geometry.tolerance,
        );
      }
      const region = scene.features.find(
        ({ source }) => source.id === "region",
      )!;
      const y = region.polygons![0][0].map(
        (point) => normalize(forward(point))[1],
      );
      expect(Math.abs(Math.min(...y) - geometry.outerTop!)).toBeLessThanOrEqual(
        geometry.tolerance,
      );
      expect(
        Math.abs(Math.max(...y) - geometry.outerBottom!),
      ).toBeLessThanOrEqual(geometry.tolerance);
      expect(
        fixture.hitLocations!.map(
          (point) =>
            hitMap(scene, inverse(forward(projectMercator(point))), 5 / scale)
              ?.id ?? null,
        ),
      ).toEqual(target.hitIds!);
    }
  });
}

const invalid = read<{
  chart: NetworkInput | MapInput;
  mutations: { path: string; value: unknown }[];
}>("fixtures/validation.json");
const expected = read<{ issues: unknown[] }>("expected/validation.json");
for (const [id, { chart, mutations }] of Object.entries(invalid)) {
  if (chart.kind !== "network" && chart.kind !== "map") continue;
  test(id, () => {
    for (const { path, value } of mutations) {
      const parts = path.slice(1).split("/");
      let candidate = chart as Record<string, unknown>;
      for (const key of parts.slice(0, -1))
        candidate = candidate[key] as Record<string, unknown>;
      candidate[parts.at(-1)!] = value;
    }
    const scene =
      chart.kind === "network" ? networkScene(chart) : mapScene(chart);
    expect(scene.issues).toEqual(expected[id].issues);
    expect(scene.initialViewport).toBeNull();
  });
}

test("scene drag converts post-zoom pointer coordinates back to layout units", () => {
  const input = read<{
    chart: NetworkInput;
    plotSize: Pair;
    actions: [
      { viewport: { kind: "network"; center: Pair; zoom: number } },
      { id: string; plotPosition: Pair },
      { type: "cancel" },
    ];
  }>("fixtures/interaction.json")["network-zoom-drag-and-cancel"];
  const events = read<{ events: VizEvent[] }>("expected/interaction.json")[
    "network-zoom-drag-and-cancel"
  ].events;
  const scene = networkScene(input.chart);
  const [width, height] = input.plotSize;
  const initial = vizState({ viewport: scene.initialViewport });
  const [zoom, drag] = input.actions;
  const fit = fitScene(scene.bounds!, scene.initialViewport!, width, height)!;
  const first = transitionViz(initial, {
    type: "zoom",
    viewport: zoom.viewport,
  });
  const { inverse } = sceneTransform(fit, zoom.viewport, width, height);
  const second = transitionViz(first.state, {
    type: "dragNode",
    id: drag.id,
    position: inverse([
      drag.plotPosition[0] * width,
      drag.plotPosition[1] * height,
    ]),
  });
  const cancel = transitionViz(second.state, { type: "cancel" });
  expect([...first.events, ...second.events, ...cancel.events]).toEqual(events);
});
