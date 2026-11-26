import { useMemo, useState } from "react";
import {
  fitScene,
  formatAxisValue,
  hitMap,
  mapScene,
  networkScene,
  projectMercator,
  sceneTransform,
  segmentDistance,
  targetKey,
  unprojectMercator,
} from "@duskmoon-dev/visualization-core";
import type {
  MapInput,
  NetworkInput,
  Pair,
  VizTarget,
} from "@duskmoon-dev/visualization-core";
import { ChartFrame, token } from "./ChartFrame.js";
import type { ChartSize } from "./ChartFrame.js";
import {
  ChartActions,
  PlotInteraction,
  useVizInteraction,
} from "./interaction.js";
import type { PlotItem, VizInteractionProps } from "./interaction.js";

type SceneProps = ChartSize & Omit<VizInteractionProps, "hiddenSeriesIds">;
const centerOfPair = (a: Pair, b: Pair): Pair => [
  (a[0] + b[0]) / 2,
  (a[1] + b[1]) / 2,
];

function edgeId(target: VizTarget): string {
  return target.kind === "datum" ? target.datumId : target.id;
}

function SceneChart({
  chart,
  selection,
  defaultSelection,
  viewport,
  onEvent,
  ...size
}: SceneProps & { chart: NetworkInput | MapInput }) {
  const network = useMemo(
    () => (chart.kind === "network" ? networkScene(chart) : null),
    [chart, chart.options?.revision],
  );
  const map = useMemo(
    () => (chart.kind === "map" ? mapScene(chart) : null),
    [chart, chart.options?.revision],
  );
  const initialViewport =
    network?.initialViewport ?? map?.initialViewport ?? null;
  const scene = network ?? map!;
  const options = chart.options;
  const theme = options?.theme;
  const [moves, setMoves] = useState<
    ReadonlyMap<string, { source: Pair; value: Pair }>
  >(new Map());
  const { state, dispatch } = useVizInteraction({
    selection,
    defaultSelection,
    viewport,
    onEvent,
    initialViewport,
    selectionMode: options?.selectionMode,
    targets: new Set(
      chart.kind === "network"
        ? [
            ...chart.nodes.map(({ id }) => targetKey({ kind: "node", id })),
            ...chart.edges.map(({ id }) => targetKey({ kind: "edge", id })),
          ]
        : chart.geoJson.features.map(({ id }) =>
            targetKey({ kind: "feature", id }),
          ),
    ),
  });
  const current =
    state.viewport?.kind === chart.kind && "center" in state.viewport
      ? state.viewport
      : initialViewport;
  const primary = theme?.seriesColors?.[0] ?? token("primary", "#005AC1");
  const regionColor =
    theme?.seriesColors?.[1] ?? token("primary-container", "#D8E2FF");
  const axis = theme?.axis ?? token("outline", "#74777F");
  const rows = useMemo(
    () =>
      chart.kind === "network"
        ? [
            ...chart.nodes.map(({ id, label, x, y }) => ({
              id: "node:" + id,
              name: label ?? id,
              raw: { x, y },
            })),
            ...chart.edges.map(({ id, label, source, target }) => ({
              id: "edge:" + id,
              name: label ?? id,
              raw: { source, target },
            })),
          ]
        : chart.geoJson.features.map(({ id, geometry, properties }) => ({
            id,
            name: typeof properties?.name === "string" ? properties.name : id,
            raw: {
              geometry: geometry.type,
              ...(properties?.value !== undefined && {
                value: properties.value,
              }),
            },
          })),
    [chart, options?.revision],
  );
  const status = scene.issues.length
    ? "error"
    : scene.bounds
      ? "ready"
      : "empty";
  return (
    <ChartFrame
      {...size}
      options={options}
      state={status}
      rows={rows}
      focusedValue={state.tooltip?.display}
      legend={
        <ChartActions
          dispatch={dispatch}
          zoom={
            current
              ? (factor) => {
                  dispatch({
                    type: "zoom",
                    viewport: {
                      ...current,
                      zoom: Math.max(0.2, Math.min(64, current.zoom / factor)),
                    },
                  });
                }
              : undefined
          }
        />
      }
    >
      {({ width, height, clipId }) => {
        if (!scene.bounds || !current || !initialViewport) return null;
        const padding =
          chart.kind === "map" ? chart.options?.padding : undefined;
        const fit = fitScene(
          scene.bounds,
          initialViewport,
          width,
          height,
          padding,
        );
        if (!fit) return null;
        const transform = sceneTransform(fit, current, width, height);
        const nodes = new Map<
          string,
          { point: Pair; world: Pair; color: string; label: string }
        >();
        const items: PlotItem[] = [];
        const nodeItems = new Map<string, PlotItem>();
        const edgePoints: {
          item: PlotItem;
          endpoints: [Pair, Pair];
          color: string;
        }[] = [];
        const mapItems = new Map<string, PlotItem>();
        function item(
          target: VizTarget,
          position: Pair,
          raw: Record<string, unknown>,
          display: string,
        ) {
          const entry: PlotItem = {
            position,
            tooltip: { type: "tooltip", target, raw, display },
          };
          items.push(entry);
          return entry;
        }
        for (const [id, node] of network?.nodes ?? []) {
          const move = moves.get(id);
          const world: Pair =
            move?.source[0] === node.x && move.source[1] === node.y
              ? move.value
              : [node.x, node.y];
          const point = transform.forward(world);
          nodes.set(id, {
            point,
            world,
            color: node.color ?? primary,
            label: node.label ?? id,
          });
          nodeItems.set(
            id,
            item(
              { kind: "node", id },
              point,
              { x: world[0], y: world[1] },
              node.label ?? id,
            ),
          );
        }
        for (const edge of network?.edges ?? []) {
          const source = nodes.get(edge.source)!.point;
          const target = nodes.get(edge.target)!.point;
          edgePoints.push({
            item: item(
              { kind: "edge", id: edge.id },
              centerOfPair(source, target),
              { source: edge.source, target: edge.target },
              edge.label ?? edge.id,
            ),
            endpoints: [source, target],
            color: edge.color ?? axis,
          });
        }
        for (const feature of map?.features ?? []) {
          const { id, properties } = feature.source;
          const position = feature.point ?? feature.polygons![0][0][0];
          const raw =
            typeof properties?.value === "number"
              ? { value: properties.value }
              : {};
          const name =
            typeof properties?.name === "string" ? properties.name : id;
          const display =
            raw.value === undefined
              ? name
              : name + ": " + formatAxisValue(raw.value, { type: "numeric" });
          mapItems.set(
            id,
            item(
              { kind: "feature", id },
              transform.forward(position),
              raw,
              display,
            ),
          );
        }

        function hitTest(x: number, y: number): PlotItem | undefined {
          const point: Pair = [x, y];
          if (map) {
            const feature = hitMap(
              map,
              transform.inverse(point),
              9 / transform.scale,
            );
            return feature && mapItems.get(feature.id);
          }
          for (const entry of [...nodeItems.values()].reverse()) {
            if (Math.hypot(x - entry.position[0], y - entry.position[1]) <= 11)
              return entry;
          }
          let closest: PlotItem | undefined;
          let threshold = 7;
          for (const edge of edgePoints) {
            const distance = segmentDistance(point, ...edge.endpoints);
            if (distance <= threshold) {
              threshold = distance;
              closest = edge.item;
            }
          }
          return closest;
        }

        const centerInWorld =
          current.kind === "map"
            ? projectMercator(current.center)
            : current.center;
        function nextCenter(value: Pair): Pair {
          if (current!.kind === "network") return value;
          const [longitude, latitude] = unprojectMercator(value);
          return [
            Math.max(-180, Math.min(180, longitude)),
            Math.max(-85, Math.min(85, latitude)),
          ];
        }
        function zoom(x: number, y: number, factor: number) {
          const target: Pair = [x * width, y * height];
          const anchor = transform.inverse(target);
          const nextZoom = Math.max(0.2, Math.min(64, current!.zoom / factor));
          const scale = fit!.scale * nextZoom;
          const center = nextCenter([
            anchor[0] - (target[0] - width / 2) / scale,
            anchor[1] - (target[1] - height / 2) / scale,
          ]);
          dispatch({
            type: "zoom",
            viewport: { kind: current!.kind, center, zoom: nextZoom },
          });
        }
        function drag(start: Pair, end: Pair, target?: VizTarget) {
          if (target?.kind === "node") {
            const node = network!.nodes.get(target.id)!;
            const position = transform.inverse(end);
            setMoves((previous) =>
              new Map(previous).set(node.id, {
                source: [node.x, node.y],
                value: position,
              }),
            );
            dispatch({ type: "dragNode", id: node.id, position });
          } else {
            const center = nextCenter([
              centerInWorld[0] + (start[0] - end[0]) / transform.scale,
              centerInWorld[1] + (start[1] - end[1]) / transform.scale,
            ]);
            dispatch({
              type: "pan",
              viewport: { kind: current!.kind, center, zoom: current!.zoom },
            });
          }
        }

        const pathFor = (ring: readonly Pair[]) =>
          ring
            .map(
              (value, index) =>
                (index === 0 ? "M" : "L") + transform.forward(value).join(","),
            )
            .join("") + "Z";
        const selectionKeys = new Set(state.ids.map(targetKey));
        return (
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={
              options?.title ??
              (chart.kind === "network" ? "Network graph" : "Map chart")
            }
            style={{
              display: "block",
              maxWidth: "100%",
              height: "auto",
              fontSize: 12,
            }}
          >
            {options?.description && <desc>{options.description}</desc>}
            <defs>
              <clipPath id={clipId}>
                <rect width={width} height={height} />
              </clipPath>
            </defs>
            <rect
              width={width}
              height={height}
              fill={
                theme?.plotBackground ??
                token("surface-container-low", "#F5F6FA")
              }
            />
            <g clipPath={`url(#${clipId})`}>
              {edgePoints.map(({ item, endpoints: [start, end], color }) => (
                <line
                  key={edgeId(item.tooltip.target)}
                  data-edge-id={edgeId(item.tooltip.target)}
                  x1={start[0]}
                  y1={start[1]}
                  x2={end[0]}
                  y2={end[1]}
                  stroke={color}
                  strokeWidth={
                    selectionKeys.has(targetKey(item.tooltip.target)) ? 4 : 1.5
                  }
                />
              ))}
              {[...nodes.entries()].map(
                ([
                  id,
                  {
                    point: [x, y],
                    color,
                    label,
                  },
                ]) => (
                  <g key={id} data-node-id={id}>
                    <circle cx={x} cy={y} r={6} fill={color} />
                    <text x={x + 9} y={y - 5} fill="currentColor">
                      {label}
                    </text>
                  </g>
                ),
              )}
              {map?.features.flatMap(
                ({ source, polygons }) =>
                  polygons?.map((polygon, index) => {
                    const selected = selectionKeys.has(
                      targetKey({ kind: "feature", id: source.id }),
                    );
                    return (
                      <path
                        key={JSON.stringify([source.id, index])}
                        data-feature-id={source.id}
                        d={polygon.map(pathFor).join("")}
                        fill={regionColor}
                        fillRule="evenodd"
                        stroke={axis}
                        strokeDasharray={selected ? "4 2" : undefined}
                        strokeWidth={selected ? 3 : 1}
                      />
                    );
                  }) ?? [],
              )}
              {map?.features.flatMap(({ source, point }) => {
                if (!point) return [];
                const [x, y] = transform.forward(point);
                return [
                  <circle
                    key={source.id}
                    data-feature-id={source.id}
                    cx={x}
                    cy={y}
                    r={5}
                    fill={primary}
                  />,
                ];
              })}
              <PlotInteraction
                width={width}
                height={height}
                items={items}
                selected={state.ids}
                tooltip={state.tooltip}
                dispatch={dispatch}
                theme={theme}
                hitTest={hitTest}
                zoom={zoom}
                onDrag={drag}
              />
            </g>
          </svg>
        );
      }}
    </ChartFrame>
  );
}

export function DmVizNetworkGraph(props: SceneProps & { chart: NetworkInput }) {
  return <SceneChart {...props} />;
}

export function DmVizMapChart(props: SceneProps & { chart: MapInput }) {
  return <SceneChart {...props} />;
}
