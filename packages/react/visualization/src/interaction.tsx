import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import {
  reconcileVizState,
  targetKey,
  transitionViz,
  vizState,
} from "@duskmoon-dev/visualization-core";
import type {
  Pair,
  Rect,
  VizAction,
  VizControl,
  VizEvent,
  VizTarget,
  VizTooltip,
  VizViewport,
} from "@duskmoon-dev/visualization-core";
import { token } from "./ChartFrame.js";
import type { Theme } from "@duskmoon-dev/visualization-core";

export type VizInteractionProps = {
  selection?: readonly VizTarget[];
  defaultSelection?: readonly VizTarget[];
  hiddenSeriesIds?: readonly string[];
  viewport?: VizViewport | null;
  onEvent?: (event: VizEvent) => void;
};

type InteractionOptions = VizInteractionProps & {
  targets: ReadonlySet<string>;
  seriesIds?: readonly string[];
  initialHidden?: readonly string[];
  initialViewport?: VizViewport | null;
  selectionMode?: "single" | "multiple";
};

export function useVizInteraction({
  selection,
  defaultSelection,
  hiddenSeriesIds,
  viewport,
  onEvent,
  targets,
  seriesIds = [],
  initialHidden,
  initialViewport,
  selectionMode,
}: InteractionOptions) {
  const initial = reconcileVizState(
    vizState({
      ids: defaultSelection,
      hiddenSeriesIds: initialHidden,
      viewport: initialViewport,
    }),
    new Set(seriesIds),
    targets,
  );
  const [local, setLocal] = useState<VizControl>({});
  const [ephemeral, setEphemeral] = useState<
    Pick<ReturnType<typeof vizState>, "tooltip" | "brush">
  >({
    tooltip: null,
    brush: null,
  });
  const state = reconcileVizState(
    {
      ids: selection ?? local.ids ?? initial.ids,
      hiddenSeriesIds:
        hiddenSeriesIds ?? local.hiddenSeriesIds ?? initial.hiddenSeriesIds,
      viewport:
        viewport !== undefined
          ? viewport
          : (local.viewport ?? initial.viewport),
      ...ephemeral,
    },
    new Set(seriesIds),
    targets,
  );

  useEffect(() => {
    const patch: VizControl = {};
    if (
      selection === undefined &&
      local.ids &&
      state.ids.length !== local.ids.length
    )
      patch.ids = state.ids;
    if (
      hiddenSeriesIds === undefined &&
      local.hiddenSeriesIds &&
      state.hiddenSeriesIds.length !== local.hiddenSeriesIds.length
    )
      patch.hiddenSeriesIds = state.hiddenSeriesIds;
    if (Object.keys(patch).length)
      setLocal((previous) => ({ ...previous, ...patch }));
    if (ephemeral.tooltip && !state.tooltip)
      setEphemeral((previous) => ({ ...previous, tooltip: null }));
  });

  const latest = useRef(state);
  latest.current = state;

  function dispatch(action: VizAction) {
    const state = latest.current;
    const result = transitionViz(state, action, {
      initial,
      seriesIds,
      selectionMode,
    });
    if (result.state === state) {
      for (const event of result.events) onEvent?.(event);
      return;
    }
    const next: VizControl = {};
    if (selection === undefined && result.state.ids !== state.ids)
      next.ids = result.state.ids;
    if (
      hiddenSeriesIds === undefined &&
      result.state.hiddenSeriesIds !== state.hiddenSeriesIds
    ) {
      next.hiddenSeriesIds = result.state.hiddenSeriesIds;
    }
    if (viewport === undefined && result.state.viewport !== state.viewport) {
      next.viewport =
        action.type === "reset" ? undefined : result.state.viewport;
    }
    latest.current = {
      ...result.state,
      ids: selection !== undefined ? state.ids : result.state.ids,
      hiddenSeriesIds:
        hiddenSeriesIds !== undefined
          ? state.hiddenSeriesIds
          : result.state.hiddenSeriesIds,
      viewport: viewport !== undefined ? state.viewport : result.state.viewport,
    };
    if (Object.keys(next).length)
      setLocal((previous) => ({ ...previous, ...next }));
    setEphemeral({ tooltip: result.state.tooltip, brush: result.state.brush });
    for (const event of result.events) onEvent?.(event);
  }

  return {
    state,
    dispatch,
    hasViewport: viewport !== undefined || local.viewport !== undefined,
  };
}

export type PlotItem = {
  tooltip: VizTooltip;
  position: Pair;
  rect?: Rect;
  hitRadius?: number;
};

function hitItem(
  items: readonly PlotItem[],
  x: number,
  y: number,
): PlotItem | undefined {
  let nearest: PlotItem | undefined;
  let distance = Infinity;
  for (const item of items) {
    if (item.rect) {
      const [left, top, width, height] = item.rect;
      const padX = width === 0 ? 4 : 0;
      const padY = height === 0 ? 4 : 0;
      if (
        x < left - padX ||
        x > left + width + padX ||
        y < top - padY ||
        y > top + height + padY
      )
        continue;
      nearest = item;
      distance = 0;
    } else {
      const next = Math.hypot(x - item.position[0], y - item.position[1]);
      if (next <= (item.hitRadius ?? 12) && next < distance) {
        nearest = item;
        distance = next;
      }
    }
  }
  return nearest;
}

type PlotProps = {
  width: number;
  height: number;
  items: readonly PlotItem[];
  selected: readonly VizTarget[];
  tooltip: VizTooltip | null;
  dispatch: (action: VizAction) => void;
  theme?: Theme;
  zoom?: (x: number, y: number, factor: number) => void;
  brush?: (start: number, end: number) => void;
  brushSelection?: Pair;
  hitTest?: (x: number, y: number) => PlotItem | undefined;
  onDrag?: (start: Pair, end: Pair, target?: VizTarget) => void;
};

export function PlotInteraction({
  width,
  height,
  items,
  selected,
  tooltip,
  dispatch,
  theme,
  zoom,
  brush,
  brushSelection,
  hitTest,
  onDrag,
}: PlotProps) {
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    target?: VizTarget;
  } | null>(null);
  const [preview, setPreview] = useState<Pair>();
  const [keyboardIndex, setKeyboardIndex] = useState(0);
  const item =
    tooltip &&
    items.find(
      (candidate) =>
        targetKey(candidate.tooltip.target) === targetKey(tooltip.target),
    );
  const keys = new Set(selected.map(targetKey));
  const selection = theme?.selection ?? token("primary", "#005AC1");
  const crosshair = theme?.crosshair ?? token("on-surface-variant", "#44474E");

  function local(event: {
    clientX: number;
    clientY: number;
    currentTarget: SVGRectElement;
  }): Pair {
    const transform = event.currentTarget.getScreenCTM();
    if (!transform) return [0, 0];
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      transform.inverse(),
    );
    return [point.x, point.y];
  }

  function show(candidate?: PlotItem) {
    if (candidate) dispatch({ type: "focus", tooltip: candidate.tooltip });
    else dispatch({ type: "blur" });
  }

  function activate(candidate?: PlotItem) {
    if (candidate)
      dispatch({ type: "activate", target: candidate.tooltip.target });
  }

  const hit = (x: number, y: number) =>
    hitTest ? hitTest(x, y) : hitItem(items, x, y);

  function pointerDown(event: PointerEvent<SVGRectElement>) {
    if (event.button !== 0 || drag.current) return;
    const [x, y] = local(event);
    drag.current = {
      id: event.pointerId,
      x,
      y,
      target: onDrag ? hit(x, y)?.tooltip.target : undefined,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent<SVGRectElement>) {
    const [x, y] = local(event);
    const start = drag.current;
    if (start) {
      if (brush && Math.abs(start.x - x) > 5)
        setPreview([start.x, Math.max(0, Math.min(width, x))]);
      return;
    }
    show(hit(x, y));
  }

  function pointerUp(event: PointerEvent<SVGRectElement>) {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    drag.current = null;
    setPreview(undefined);
    const [x, y] = local(event);
    const moved = Math.hypot(start.x - x, start.y - y) > 5;
    if (brush && Math.abs(start.x - x) > 5) {
      brush(start.x / width, Math.max(0, Math.min(1, x / width)));
    } else if (moved) {
      onDrag?.([start.x, start.y], [x, y], start.target);
    } else {
      const candidate = hit(x, y);
      // Selection is emitted first so touch activation can also reveal the value.
      activate(candidate);
      if (event.pointerType !== "mouse") show(candidate);
    }
  }

  function cancel() {
    if (!drag.current) return;
    drag.current = null;
    setPreview(undefined);
    dispatch({ type: "cancel" });
  }

  function onKeyDown(event: KeyboardEvent<SVGRectElement>) {
    const { key } = event;
    if (key === "Escape") {
      dispatch({ type: "clearSelection" });
      return;
    }
    if (zoom && (key === "+" || key === "=" || key === "-")) {
      event.preventDefault();
      zoom(0.5, 0.5, key === "-" ? 1.2 : 1 / 1.2);
      return;
    }
    const arrows = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
    if (
      event.shiftKey &&
      brush &&
      (key === "ArrowLeft" || key === "ArrowRight")
    ) {
      event.preventDefault();
      const anchor =
        items[keyboardIndex % items.length]?.position[0] ?? width / 2;
      const start = brushSelection?.[0] ?? anchor;
      const stop = brushSelection?.[1] ?? anchor;
      const next = Math.max(
        0,
        Math.min(width, stop + ((key === "ArrowLeft" ? -1 : 1) * width) / 10),
      );
      if (start !== next) brush(start / width, next / width);
      return;
    }
    if (onDrag && (event.shiftKey || event.altKey) && arrows.includes(key)) {
      const candidate = event.altKey
        ? items[keyboardIndex % items.length]
        : undefined;
      if (event.altKey && candidate?.tooltip.target.kind !== "node") return;
      event.preventDefault();
      const start: Pair = candidate?.position ?? [width / 2, height / 2];
      const sign = event.altKey ? -1 : 1;
      onDrag(
        start,
        [
          start[0] +
            sign *
              (key === "ArrowLeft"
                ? width / 10
                : key === "ArrowRight"
                  ? -width / 10
                  : 0),
          start[1] +
            sign *
              (key === "ArrowUp"
                ? height / 10
                : key === "ArrowDown"
                  ? -height / 10
                  : 0),
        ],
        candidate?.tooltip.target,
      );
      return;
    }
    if (!items.length) return;
    if (key === "Enter" || key === " ") {
      event.preventDefault();
      activate(items[keyboardIndex % items.length]);
    } else if (
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ].includes(key)
    ) {
      event.preventDefault();
      const step = key === "ArrowLeft" || key === "ArrowUp" ? -1 : 1;
      const next =
        key === "Home"
          ? 0
          : key === "End"
            ? items.length - 1
            : (keyboardIndex + step + items.length) % items.length;
      setKeyboardIndex(next);
      show(items[next]);
    }
  }

  const span = preview ?? brushSelection;
  const cell = item?.position;
  const tipX = cell ? Math.max(0, Math.min(width - 210, cell[0] + 8)) : 0;
  const tipY = cell ? Math.max(0, Math.min(height - 38, cell[1] + 8)) : 0;
  return (
    <g>
      {span && (
        <rect
          x={Math.min(...span)}
          width={Math.abs(span[1] - span[0])}
          height={height}
          fill={selection}
          fillOpacity={0.16}
          pointerEvents="none"
        />
      )}
      {items
        .filter(({ tooltip }) => keys.has(targetKey(tooltip.target)))
        .map(({ tooltip, position, rect }) =>
          rect ? (
            <rect
              key={targetKey(tooltip.target)}
              x={rect[0]}
              y={rect[1]}
              width={Math.max(rect[2], 2)}
              height={Math.max(rect[3], 2)}
              fill="none"
              stroke={selection}
              strokeWidth={2}
              strokeDasharray="3 2"
              pointerEvents="none"
            />
          ) : (
            <circle
              key={targetKey(tooltip.target)}
              cx={position[0]}
              cy={position[1]}
              r={7}
              fill="none"
              stroke={selection}
              strokeWidth={2}
              pointerEvents="none"
            />
          ),
        )}
      {cell && (
        <circle
          cx={cell[0]}
          cy={cell[1]}
          r={5}
          fill="none"
          stroke={crosshair}
          pointerEvents="none"
        />
      )}
      <rect
        data-plot-interaction=""
        width={width}
        height={height}
        fill="transparent"
        tabIndex={0}
        role="group"
        aria-label="Chart data. Use arrow keys to inspect and Enter to select."
        onFocus={() => show(items[keyboardIndex % items.length])}
        onBlur={() => show()}
        onKeyDown={onKeyDown}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerLeave={() => !drag.current && show()}
        onPointerCancel={cancel}
        onLostPointerCapture={cancel}
        onWheel={
          zoom
            ? (event) => {
                const [x, y] = local(event);
                zoom(
                  x / width,
                  y / height,
                  Math.exp(Math.max(-300, Math.min(300, event.deltaY)) * 0.002),
                );
              }
            : undefined
        }
        style={{ touchAction: brush || onDrag ? "none" : "manipulation" }}
      />
      {item && tooltip && (
        <foreignObject
          x={tipX}
          y={tipY}
          width={Math.min(210, width)}
          height={38}
          pointerEvents="none"
        >
          <div
            role="status"
            style={{
              display: "inline-block",
              padding: "4px 8px",
              borderRadius: 4,
              background:
                theme?.tooltipBackground ?? token("inverse-surface", "#313033"),
              color:
                theme?.tooltipText ?? token("inverse-on-surface", "#F4EFF4"),
            }}
          >
            {tooltip.display}
          </div>
        </foreignObject>
      )}
    </g>
  );
}

export function ChartActions({
  dispatch,
  brush,
  zoom,
}: {
  dispatch: (action: VizAction) => void;
  brush?: Pair | null;
  zoom?: (factor: number) => void;
}) {
  return (
    <div
      aria-label="Chart actions"
      style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "4px 16px" }}
    >
      {zoom && (
        <>
          <button type="button" onClick={() => zoom(1 / 1.2)}>
            Zoom in
          </button>
          <button type="button" onClick={() => zoom(1.2)}>
            Zoom out
          </button>
        </>
      )}
      <button
        type="button"
        onClick={() => dispatch({ type: "clearSelection" })}
      >
        Clear selection
      </button>
      {brush && (
        <button type="button" onClick={() => dispatch({ type: "clearBrush" })}>
          Clear range
        </button>
      )}
      <button type="button" onClick={() => dispatch({ type: "reset" })}>
        Reset chart
      </button>
    </div>
  );
}
