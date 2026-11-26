import { useMemo } from "react";
import {
  ChartActions,
  PlotInteraction,
  useVizInteraction,
} from "./interaction.js";
import type { PlotItem, VizInteractionProps } from "./interaction.js";
import { targetKey, zoomDomain } from "@duskmoon-dev/visualization-core";
import type { VizViewport } from "@duskmoon-dev/visualization-core";
import { scaleBand, scaleLinear, scaleUtc } from "@visx/scale";
import { Bar, LinePath } from "@visx/shape";
import { formatAxisValue, layoutXY } from "@duskmoon-dev/visualization-core";
import type {
  Axis,
  BarInput,
  LineInput,
  Pair,
  PlotDatum,
  ScatterInput,
  Time,
  XYChartInput,
  XYLayout,
} from "@duskmoon-dev/visualization-core";
import { ChartFrame, Legend, seriesColors, token } from "./ChartFrame.js";
import type { ChartSize } from "./ChartFrame.js";

function ticks(
  axis: Axis,
  domain: NonNullable<XYLayout["xDomain"]>,
  values: readonly Time[],
  span: number,
) {
  if (axis.type === "category") {
    const scale = scaleBand({
      domain: [...(domain as readonly string[])],
      range: [0, span],
    });
    const maxTicks = Math.max(1, Math.floor(span / 44));
    const interval = axis.tickValues ? 1 : Math.ceil(values.length / maxTicks);
    return values
      .filter((_, index) => index % interval === 0)
      .map((value) => ({
        value,
        position: (scale(String(value)) ?? 0) + scale.bandwidth() / 2,
      }));
  }

  const [low, high] = domain as Pair;
  const scale = scaleLinear({ domain: [low, high], range: [0, span] });
  const count = Math.max(
    2,
    Math.floor(span / (axis.type === "time" ? 140 : 70)),
  );
  const automatic =
    axis.type === "time"
      ? scaleUtc({
          domain: [
            new Date(Math.max(low, -8.64e15)),
            new Date(Math.min(high, 8.64e15)),
          ],
        })
          .ticks(count)
          .map(Number)
      : scale.ticks(count);
  return (axis.tickValues || !automatic.length ? values : automatic)
    .filter(
      (value) => axis.type !== "time" || Math.abs(Number(value)) <= 8.64e15,
    )
    .map((value) => ({ value, position: scale(Number(value)) }));
}

type Marker = NonNullable<NonNullable<LineInput["options"]>["marker"]>;

function glyphPath(shape: Marker["shape"], r: number): string | undefined {
  switch (shape) {
    case "square":
      return `M${-r},${-r}h${2 * r}v${2 * r}h${-2 * r}Z`;
    case "triangle":
      return `M0,${-r}L${r},${r}H${-r}Z`;
    case "diamond":
      return `M0,${-r}L${r},0L0,${r}L${-r},0Z`;
    case "cross":
      return `M${-r},${-r}L${r},${r}M${-r},${r}L${r},${-r}`;
    case "plus":
      return `M${-r},0H${r}M0,${-r}V${r}`;
    case "star":
      return (
        Array.from({ length: 10 }, (_, index) => {
          const angle = (index * Math.PI) / 5 - Math.PI / 2;
          const radius = index % 2 === 0 ? r : r * 0.45;
          return `${index === 0 ? "M" : "L"}${Math.cos(angle) * radius},${Math.sin(angle) * radius}`;
        }).join("") + "Z"
      );
  }
}

function Glyph({
  point,
  width,
  height,
  radius,
  path,
  strokeWidth,
  outline,
}: {
  point: PlotDatum;
  width: number;
  height: number;
  radius: number;
  path?: string;
  strokeWidth: number;
  outline: string;
}) {
  const [x, y] = point.point;
  if (x < 0 || x > 1 || y < 0 || y > 1) return null;
  return (
    <g
      transform={`translate(${x * width}, ${y * height})`}
      data-datum-id={point.datum.id}
    >
      {path ? (
        <path
          d={path}
          fill={point.color}
          stroke={strokeWidth ? point.color : outline}
          strokeWidth={strokeWidth || 0.65}
        />
      ) : (
        <circle
          r={radius}
          fill={point.color}
          stroke={outline}
          strokeWidth={0.85}
        />
      )}
    </g>
  );
}

const plotColors = {
  seriesColors,
  heatmapColors: ["#E3E2E6", "#005AC1"],
  missing: "#E3E2E6",
};

function XYChart({
  chart,
  selection,
  defaultSelection,
  hiddenSeriesIds,
  viewport,
  onEvent,
  ...size
}: ChartSize & VizInteractionProps & { chart: XYChartInput }) {
  const { xAxis, yAxis, options } = chart;
  const theme = options?.theme;
  const base = useMemo(
    () => layoutXY(chart, plotColors),
    [chart, options?.revision],
  );
  const axesReady = base.xDomain && base.yDomain && xAxis.type !== "category";
  const initialViewport: VizViewport | null = !axesReady
    ? null
    : chart.kind === "line"
      ? { kind: "line", x: base.xDomain as Pair }
      : chart.kind === "scatter"
        ? { kind: "scatter", x: base.xDomain as Pair, y: base.yDomain! }
        : null;
  const rows = useMemo(
    () =>
      chart.series.flatMap(({ id, name, data }) =>
        data.map((datum) => ({
          id: targetKey({ kind: "datum", seriesId: id, datumId: datum.id }),
          name: name + " · " + datum.id,
          raw: { x: datum.x, y: datum.y },
        })),
      ),
    [chart, options?.revision],
  );
  const targets = useMemo(() => new Set(rows.map(({ id }) => id)), [rows]);
  const { state, dispatch, hasViewport } = useVizInteraction({
    selection,
    defaultSelection,
    hiddenSeriesIds,
    viewport,
    onEvent,
    targets,
    initialViewport,
    seriesIds: chart.series.map(({ id }) => id),
    initialHidden: options?.hiddenSeriesIds,
    selectionMode: options?.selectionMode,
  });
  const override =
    hasViewport &&
    xAxis.type !== "category" &&
    state.viewport?.kind === chart.kind
      ? state.viewport
      : null;
  const layout = useMemo(
    () =>
      layoutXY(
        {
          ...chart,
          options: { ...options, hiddenSeriesIds: state.hiddenSeriesIds },
          xAxis:
            override && "x" in override
              ? { ...xAxis, domain: override.x }
              : xAxis,
          yAxis:
            override && "y" in override
              ? { ...yAxis, domain: override.y }
              : yAxis,
        } as XYChartInput,
        plotColors,
      ),
    [chart, options?.revision, state.hiddenSeriesIds, override],
  );
  const active: VizViewport | null =
    override ??
    (layout.xDomain && layout.yDomain && initialViewport
      ? initialViewport.kind === "line"
        ? { kind: "line", x: layout.xDomain as Pair }
        : { kind: "scatter", x: layout.xDomain as Pair, y: layout.yDomain }
      : null);
  const horizontal =
    chart.kind === "bar" && chart.options?.orientation === "horizontal";
  const marker = chart.kind !== "bar" ? chart.options?.marker : undefined;
  const radius = marker?.radius ?? 4;
  const path = glyphPath(marker?.shape, radius);
  const strokeWidth =
    marker?.shape === "plus" || marker?.shape === "cross" ? 2 : 0;
  const labels = new Map(
    "categories" in chart
      ? chart.categories?.map(({ id, label }) => [id, label])
      : [],
  );
  const axisColor = theme?.axis ?? token("outline", "#74777F");
  const gridColor = theme?.grid ?? token("outline-variant", "#C4C6D0");
  const label = (value: Time, axis: Axis) =>
    formatAxisValue(value, axis, labels);
  const zoom =
    active && "x" in active
      ? (x: number, y: number, factor: number) => {
          if (active.kind === "line")
            dispatch({
              type: "zoom",
              viewport: {
                kind: "line",
                x: zoomDomain(active.x, x, factor, xAxis.type === "time"),
              },
            });
          if (active.kind === "scatter")
            dispatch({
              type: "zoom",
              viewport: {
                kind: "scatter",
                x: zoomDomain(active.x, x, factor),
                y: zoomDomain(active.y, 1 - y, factor),
              },
            });
        }
      : undefined;
  return (
    <ChartFrame
      {...size}
      options={options}
      state={layout.state}
      rows={rows}
      focusedValue={state.tooltip?.display}
      legend={
        <>
          <Legend
            items={layout.series}
            onToggle={(seriesId) =>
              dispatch({ type: "toggleSeries", seriesId })
            }
          />
          <ChartActions
            dispatch={dispatch}
            brush={state.brush}
            zoom={zoom && ((factor) => zoom(0.5, 0.5, factor))}
          />
        </>
      }
    >
      {({ width, height, clipId }) => {
        const left = Math.min(width / 3, horizontal ? 140 : 100);
        const top = 16;
        const innerWidth = width - left - 16;
        const innerHeight =
          height -
          top -
          (horizontal ? (yAxis.label ? 44 : 28) : xAxis.label ? 44 : 28);
        const bottomAxis = horizontal ? yAxis : xAxis;
        const leftAxis = horizontal ? xAxis : yAxis;
        const xTicks = ticks(
          xAxis,
          layout.xDomain!,
          layout.xTicks,
          horizontal ? innerHeight : innerWidth,
        );
        const yTicks = ticks(
          yAxis,
          layout.yDomain!,
          layout.yTicks,
          horizontal ? innerWidth : innerHeight,
        );
        const bottomTicks = horizontal ? yTicks : xTicks;
        const leftTicks = horizontal
          ? xTicks
          : yTicks.map(({ value, position }) => ({
              value,
              position: innerHeight - position,
            }));
        const items = layout.series.flatMap((series) =>
          series.points.flatMap(({ point, datum, rect }): PlotItem[] => {
            if (point.some((value) => value < 0 || value > 1)) return [];
            const display =
              label(datum.y!, yAxis) + (yAxis.unit ? " " + yAxis.unit : "");
            return [
              {
                position: [point[0] * innerWidth, point[1] * innerHeight],
                rect: rect && [
                  rect[0] * innerWidth,
                  rect[1] * innerHeight,
                  rect[2] * innerWidth,
                  rect[3] * innerHeight,
                ],
                hitRadius: Math.max(12, radius),
                tooltip: {
                  type: "tooltip",
                  target: {
                    kind: "datum",
                    seriesId: series.id,
                    datumId: datum.id,
                  },
                  raw: { x: datum.x, y: datum.y },
                  display,
                  ...(yAxis.unit && { unit: yAxis.unit }),
                },
              },
            ];
          }),
        );
        const line = active?.kind === "line" ? active : null;
        function brush(start: number, end: number) {
          if (!line) return;
          const value = (fraction: number) => {
            const x = line.x[0] * (1 - fraction) + line.x[1] * fraction;
            return xAxis.type === "time" ? Math.round(x) : x;
          };
          dispatch({
            type: "brush",
            range: [value(Math.min(start, end)), value(Math.max(start, end))],
          });
        }
        const brushX = (value: number, [low, high]: Pair) =>
          Math.max(
            0,
            Math.min(innerWidth, ((value - low) / (high - low)) * innerWidth),
          );
        const brushSelection: Pair | undefined =
          line && state.brush
            ? [brushX(state.brush[0], line.x), brushX(state.brush[1], line.x)]
            : undefined;
        return (
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={options?.title || chart.kind + " chart"}
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
                <rect width={innerWidth} height={innerHeight} />
              </clipPath>
            </defs>
            <g transform={`translate(${left}, ${top})`}>
              <rect
                width={innerWidth}
                height={innerHeight}
                fill={
                  theme?.plotBackground ??
                  token("surface-container-low", "#F5F6FA")
                }
              />
              {leftTicks.map(({ value, position }, index) => (
                <g key={index} transform={`translate(0,${position})`}>
                  <line x2={innerWidth} stroke={gridColor} />
                  <foreignObject
                    x={leftAxis.label ? 16 - left : -left}
                    y={-9}
                    width={left - (leftAxis.label ? 24 : 8)}
                    height={18}
                  >
                    <div
                      title={label(value, leftAxis)}
                      style={{
                        textAlign: "right",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        color:
                          theme?.mutedText ??
                          token("on-surface-variant", "#44474E"),
                      }}
                    >
                      {label(value, leftAxis)}
                    </div>
                  </foreignObject>
                </g>
              ))}
              {bottomTicks.map(({ value, position }, index) => {
                const labelWidth = Math.min(
                  innerWidth / bottomTicks.length,
                  150,
                );
                const text = label(value, bottomAxis);
                const labelX = Math.max(
                  -left,
                  Math.min(
                    position - labelWidth / 2,
                    innerWidth + 16 - labelWidth,
                  ),
                );
                return (
                  <g key={index} transform={`translate(${position},0)`}>
                    <line y2={innerHeight} stroke={gridColor} />
                    <foreignObject
                      x={labelX - position}
                      y={innerHeight + 6}
                      width={labelWidth}
                      height={18}
                    >
                      <div
                        title={text}
                        style={{
                          textAlign: "center",
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          color:
                            theme?.mutedText ??
                            token("on-surface-variant", "#44474E"),
                        }}
                      >
                        {text}
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
              <path
                d={`M0,0V${innerHeight}H${innerWidth}`}
                fill="none"
                stroke={axisColor}
              />
              {bottomAxis.label && (
                <text
                  x={innerWidth / 2}
                  y={innerHeight + 36}
                  textAnchor="middle"
                  fill="currentColor"
                >
                  {bottomAxis.label}
                </text>
              )}
              {leftAxis.label && (
                <text
                  transform={`translate(${10 - left},${innerHeight / 2}) rotate(-90)`}
                  textAnchor="middle"
                  fill="currentColor"
                >
                  {leftAxis.label}
                </text>
              )}
              {layout.baseline !== undefined &&
                (horizontal ? (
                  <line
                    x1={layout.baseline * innerWidth}
                    x2={layout.baseline * innerWidth}
                    y2={innerHeight}
                    stroke={axisColor}
                  />
                ) : (
                  <line
                    y1={layout.baseline * innerHeight}
                    y2={layout.baseline * innerHeight}
                    x2={innerWidth}
                    stroke={axisColor}
                  />
                ))}
              <g clipPath={`url(#${clipId})`}>
                {layout.series
                  .filter(({ visible }) => visible)
                  .map((series) => (
                    <g key={series.id} data-series-id={series.id}>
                      {series.segments.map((data, index) => (
                        <LinePath
                          key={index}
                          data={data}
                          x={(datum) => datum.point[0] * innerWidth}
                          y={(datum) => datum.point[1] * innerHeight}
                          stroke={series.color}
                          strokeWidth={2}
                          style={{
                            filter: `drop-shadow(0 0 .65px ${axisColor})`,
                          }}
                        />
                      ))}
                      {chart.kind === "bar" &&
                        series.points.map(({ datum, rect, color }) => {
                          const [x, y, w, h] = rect!;
                          return (
                            <Bar
                              key={datum.id}
                              data-datum-id={datum.id}
                              x={x * innerWidth}
                              y={y * innerHeight}
                              width={w * innerWidth}
                              height={h * innerHeight}
                              fill={color}
                              stroke={axisColor}
                              strokeWidth={0.65}
                            />
                          );
                        })}
                      {(marker?.visible ?? chart.kind === "scatter") &&
                        series.points.map((point) => (
                          <Glyph
                            key={point.datum.id}
                            point={point}
                            width={innerWidth}
                            height={innerHeight}
                            radius={radius}
                            path={path}
                            strokeWidth={strokeWidth}
                            outline={axisColor}
                          />
                        ))}
                    </g>
                  ))}
              </g>
              <PlotInteraction
                width={innerWidth}
                height={innerHeight}
                items={items}
                selected={state.ids}
                tooltip={state.tooltip}
                dispatch={dispatch}
                theme={theme}
                zoom={zoom}
                brush={line ? brush : undefined}
                brushSelection={brushSelection ?? undefined}
              />
            </g>
          </svg>
        );
      }}
    </ChartFrame>
  );
}

export function DmVizLineChart(
  props: ChartSize & VizInteractionProps & { chart: LineInput },
) {
  return <XYChart {...props} />;
}

export function DmVizBarChart(
  props: ChartSize & VizInteractionProps & { chart: BarInput },
) {
  return <XYChart {...props} />;
}

export function DmVizScatterChart(
  props: ChartSize & VizInteractionProps & { chart: ScatterInput },
) {
  return <XYChart {...props} />;
}
