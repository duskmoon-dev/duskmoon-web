import { useMemo } from "react";
import {
  ChartActions,
  PlotInteraction,
  useVizInteraction,
} from "./interaction.js";
import type { PlotItem, VizInteractionProps } from "./interaction.js";
import { targetKey } from "@duskmoon-dev/visualization-core";
import { Bar } from "@visx/shape";
import {
  formatAxisValue,
  layoutHeatmap,
} from "@duskmoon-dev/visualization-core";
import type { HeatmapInput } from "@duskmoon-dev/visualization-core";
import { ChartFrame, token } from "./ChartFrame.js";
import type { ChartSize } from "./ChartFrame.js";

function gradient(position: number): string {
  const high = token("primary", "#005AC1");
  const low = token("surface-container-highest", "#E3E2E6");
  return `color-mix(in srgb, ${low}, ${high} ${position * 100}%)`;
}

export function DmVizHeatmap({
  chart,
  selection,
  defaultSelection,
  onEvent,
  ...size
}: ChartSize &
  Pick<VizInteractionProps, "selection" | "defaultSelection" | "onEvent"> & {
    chart: HeatmapInput;
  }) {
  const { columns, rows, options } = chart;
  const layout = useMemo(
    () => layoutHeatmap(chart),
    [chart, options?.revision],
  );
  const rowsData = useMemo(
    () =>
      chart.cells.map(({ id, rowId, columnId, value }) => ({
        id: targetKey({ kind: "cell", id }),
        name: id,
        raw: { row: rowId, column: columnId, value },
      })),
    [chart, options?.revision],
  );
  const tokens = options?.theme;
  const { state, dispatch } = useVizInteraction({
    selection,
    defaultSelection,
    onEvent,
    selectionMode: options?.selectionMode,
    targets: new Set(
      chart.cells.map(({ id }) => targetKey({ kind: "cell", id })),
    ),
  });
  const numeric = { type: "numeric" } as const;
  const legend = layout.valueDomain && (
    <div
      aria-label="Heatmap color scale"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 16px",
        fontSize: 12,
      }}
    >
      <span>{formatAxisValue(layout.valueDomain[0], numeric)}</span>
      <span
        style={{
          width: 100,
          height: 8,
          background: `linear-gradient(to right, ${
            tokens?.heatmapColors?.join(", ") ??
            [gradient(0), gradient(1)].join(", ")
          })`,
        }}
      />
      <span>{formatAxisValue(layout.valueDomain[1], numeric)}</span>
    </div>
  );
  return (
    <ChartFrame
      {...size}
      options={options}
      state={layout.state}
      rows={rowsData}
      focusedValue={state.tooltip?.display}
      legend={
        <>
          {legend}
          <ChartActions dispatch={dispatch} />
        </>
      }
    >
      {({ width, height }) => {
        const left = Math.min(110, width / 3);
        const top = 26;
        const innerWidth = width - left - 16;
        const innerHeight = height - top - 16;
        const columnWidth = innerWidth / columns.length;
        const rowHeight = innerHeight / rows.length;
        const items = layout.cells.flatMap(
          ({ cell, rect: [x, y, w, h] }): PlotItem[] =>
            cell
              ? [
                  {
                    position: [
                      (x + w / 2) * innerWidth,
                      (y + h / 2) * innerHeight,
                    ],
                    rect: [
                      x * innerWidth,
                      y * innerHeight,
                      w * innerWidth,
                      h * innerHeight,
                    ],
                    tooltip: {
                      type: "tooltip",
                      target: { kind: "cell", id: cell.id },
                      raw: { value: cell.value },
                      display:
                        cell.value === null
                          ? "Missing value"
                          : formatAxisValue(cell.value, numeric),
                    },
                  },
                ]
              : [],
        );
        return (
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={options?.title || "Heatmap"}
            style={{
              display: "block",
              maxWidth: "100%",
              height: "auto",
              fontSize: 12,
            }}
          >
            {options?.description && <desc>{options.description}</desc>}
            <g transform={`translate(${left}, ${top})`}>
              {columns.map(({ id, label }, index) => (
                <foreignObject
                  key={id}
                  x={index * columnWidth}
                  y={-20}
                  width={columnWidth}
                  height={18}
                >
                  <div
                    title={label}
                    style={{
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {label}
                  </div>
                </foreignObject>
              ))}
              {rows.map(({ id, label }, index) => (
                <foreignObject
                  key={id}
                  x={-left}
                  y={(index + 0.5) * rowHeight - 9}
                  width={left - 8}
                  height={18}
                >
                  <div
                    title={label}
                    style={{
                      textAlign: "right",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {label}
                  </div>
                </foreignObject>
              ))}
              {layout.cells.map(
                ({ cell, rowId, columnId, rect, color, colorPosition }) => {
                  const [x, y, w, h] = rect;
                  const fill =
                    colorPosition === null
                      ? (tokens?.missing ??
                        token("surface-container-highest", color))
                      : tokens?.heatmapColors
                        ? color
                        : gradient(colorPosition);
                  return (
                    <g
                      key={JSON.stringify([rowId, columnId])}
                      data-cell-id={cell?.id}
                      transform={`translate(${x * innerWidth}, ${y * innerHeight})`}
                    >
                      <Bar
                        width={w * innerWidth}
                        height={h * innerHeight}
                        fill={fill}
                      />
                      {options?.showValues && cell?.value != null && (
                        <text
                          x={columnWidth / 2}
                          y={rowHeight / 2}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="currentColor"
                        >
                          {formatAxisValue(cell.value, numeric)}
                        </text>
                      )}
                    </g>
                  );
                },
              )}
              <PlotInteraction
                width={innerWidth}
                height={innerHeight}
                items={items}
                selected={state.ids}
                tooltip={state.tooltip}
                dispatch={dispatch}
                theme={tokens}
              />
            </g>
          </svg>
        );
      }}
    </ChartFrame>
  );
}
