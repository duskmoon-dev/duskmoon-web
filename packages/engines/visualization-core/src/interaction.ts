import type { Pair } from "./model.js";

export type VizTarget =
  | { kind: "datum"; seriesId: string; datumId: string }
  | { kind: "cell" | "node" | "edge" | "feature"; id: string };

export type VizViewport =
  | { kind: "line"; x: Pair }
  | { kind: "scatter"; x: Pair; y: Pair }
  | { kind: "network" | "map"; center: Pair; zoom: number };

export type VizTooltip = {
  type: "tooltip";
  target: VizTarget;
  raw: Readonly<Record<string, unknown>>;
  display: string;
  unit?: string;
};

export type VizEvent =
  | VizTooltip
  | {
      type: "selection";
      ids: readonly VizTarget[];
      reason: "select" | "toggle" | "clear" | "reset";
    }
  | {
      type: "visibility";
      seriesId: string;
      visible: boolean;
      reason: "toggle" | "reset";
    }
  | {
      type: "viewport";
      viewport: VizViewport;
      reason: "zoom" | "pan" | "reset";
    }
  | { type: "brush"; range: Pair | null; reason: "brush" | "clear" | "reset" }
  | { type: "nodeMove"; id: string; position: Pair };

export type VizState = {
  ids: readonly VizTarget[];
  hiddenSeriesIds: readonly string[];
  viewport: VizViewport | null;
  brush: Pair | null;
  tooltip: VizTooltip | null;
};

export type VizControl = Partial<
  Pick<VizState, "ids" | "hiddenSeriesIds" | "viewport">
>;

export type VizAction =
  | { type: "focus"; tooltip: VizTooltip }
  | { type: "blur" | "cancel" | "clearSelection" | "clearBrush" | "reset" }
  | { type: "activate"; target: VizTarget }
  | { type: "toggleSeries"; seriesId: string }
  | { type: "zoom" | "pan"; viewport: VizViewport }
  | { type: "brush"; range: Pair }
  | { type: "dragNode"; id: string; position: Pair };

const emptyIds: readonly never[] = [];

export function vizState(initial: VizControl = {}): VizState {
  return {
    ids: initial.ids ?? emptyIds,
    hiddenSeriesIds: initial.hiddenSeriesIds ?? emptyIds,
    viewport: initial.viewport ?? null,
    brush: null,
    tooltip: null,
  };
}

export function targetKey(target: VizTarget): string {
  return JSON.stringify(
    target.kind === "datum"
      ? [target.kind, target.seriesId, target.datumId]
      : [target.kind, target.id],
  );
}

function samePair(left: Pair | null, right: Pair | null): boolean {
  return (
    left === right ||
    !!(left && right && left[0] === right[0] && left[1] === right[1])
  );
}

export function sameViewport(
  left: VizViewport | null,
  right: VizViewport | null,
): boolean {
  if (left === right) return true;
  if (!left || !right || left.kind !== right.kind) return false;
  if ("center" in left && "center" in right)
    return left.zoom === right.zoom && samePair(left.center, right.center);
  if ("x" in left && "x" in right) {
    return (
      samePair(left.x, right.x) &&
      (!("y" in left) || ("y" in right && samePair(left.y, right.y)))
    );
  }
  return false;
}

function validRange(range: Pair): boolean {
  return range.every(Number.isFinite) && range[0] < range[1];
}

function validViewport(viewport: VizViewport): boolean {
  return "center" in viewport
    ? viewport.center.every(Number.isFinite) &&
        Number.isFinite(viewport.zoom) &&
        viewport.zoom > 0
    : validRange(viewport.x) && (!("y" in viewport) || validRange(viewport.y));
}

function sameSelection(
  left: readonly VizTarget[],
  right: readonly VizTarget[],
): boolean {
  if (left.length !== right.length) return false;
  const keys = new Set(left.map(targetKey));
  return right.every((target) => keys.has(targetKey(target)));
}

export function reconcileVizState(
  state: VizState,
  series: ReadonlySet<string>,
  targets: ReadonlySet<string>,
): VizState {
  const hiddenSeriesIds = state.hiddenSeriesIds.filter((id) => series.has(id));
  const ids = state.ids.filter((target) => targets.has(targetKey(target)));
  const target = state.tooltip?.target;
  const keepTooltip =
    target &&
    targets.has(targetKey(target)) &&
    (target.kind !== "datum" || !hiddenSeriesIds.includes(target.seriesId));
  return {
    ...state,
    hiddenSeriesIds:
      hiddenSeriesIds.length === state.hiddenSeriesIds.length
        ? state.hiddenSeriesIds
        : hiddenSeriesIds,
    ids: ids.length === state.ids.length ? state.ids : ids,
    tooltip: keepTooltip ? state.tooltip : null,
  };
}

export function transitionViz(
  current: VizState,
  action: VizAction,
  {
    initial = vizState(),
    seriesIds = [],
    selectionMode = "single",
  }: {
    initial?: VizState;
    seriesIds?: readonly string[];
    selectionMode?: "single" | "multiple";
  } = {},
): { state: VizState; events: VizEvent[] } {
  let state = current;
  const events: VizEvent[] = [];

  function select(
    ids: readonly VizTarget[],
    reason: Extract<VizEvent, { type: "selection" }>["reason"],
  ) {
    if (sameSelection(state.ids, ids)) return;
    state = { ...state, ids };
    events.push({ type: "selection", ids, reason });
  }

  function visibility(
    seriesId: string,
    visible: boolean,
    reason: "toggle" | "reset",
  ) {
    const hidden = state.hiddenSeriesIds.includes(seriesId);
    if (hidden !== visible) return;
    const hiddenSeriesIds = visible
      ? state.hiddenSeriesIds.filter((id) => id !== seriesId)
      : [...state.hiddenSeriesIds, seriesId];
    const target = state.tooltip?.target;
    const tooltip =
      !visible && target?.kind === "datum" && target.seriesId === seriesId
        ? null
        : state.tooltip;
    state = { ...state, hiddenSeriesIds, tooltip };
    events.push({ type: "visibility", seriesId, visible, reason });
  }

  function setViewport(
    viewport: VizViewport | null,
    reason: "zoom" | "pan" | "reset",
  ) {
    if (
      !viewport ||
      !validViewport(viewport) ||
      sameViewport(state.viewport, viewport)
    )
      return;
    state = { ...state, viewport, tooltip: null };
    events.push({ type: "viewport", viewport, reason });
  }

  function setBrush(range: Pair | null, reason: "brush" | "clear" | "reset") {
    if ((range && !validRange(range)) || samePair(state.brush, range)) return;
    state = { ...state, brush: range };
    events.push({ type: "brush", range, reason });
  }

  switch (action.type) {
    case "focus": {
      const tooltip = action.tooltip;
      if (
        tooltip.target.kind === "datum" &&
        state.hiddenSeriesIds.includes(tooltip.target.seriesId)
      )
        break;
      const previous = state.tooltip;
      if (
        previous &&
        targetKey(previous.target) === targetKey(tooltip.target) &&
        previous.display === tooltip.display &&
        previous.unit === tooltip.unit &&
        JSON.stringify(previous.raw) === JSON.stringify(tooltip.raw)
      )
        break;
      state = { ...state, tooltip };
      events.push(tooltip);
      break;
    }
    case "blur":
    case "cancel":
      if (state.tooltip) state = { ...state, tooltip: null };
      break;
    case "activate": {
      if (
        action.target.kind === "datum" &&
        state.hiddenSeriesIds.includes(action.target.seriesId)
      )
        break;
      const key = targetKey(action.target);
      const selected = current.ids.some((target) => targetKey(target) === key);
      if (selectionMode === "multiple") {
        select(
          selected
            ? current.ids.filter((target) => targetKey(target) !== key)
            : [...current.ids, action.target],
          "toggle",
        );
      } else {
        select([action.target], "select");
      }
      break;
    }
    case "clearSelection":
      select([], "clear");
      break;
    case "toggleSeries":
      if (seriesIds.includes(action.seriesId)) {
        visibility(
          action.seriesId,
          current.hiddenSeriesIds.includes(action.seriesId),
          "toggle",
        );
      }
      break;
    case "zoom":
    case "pan":
      setViewport(action.viewport, action.type);
      break;
    case "brush":
      setBrush(action.range, "brush");
      break;
    case "clearBrush":
      setBrush(null, "clear");
      break;
    case "dragNode":
      if (action.position.every(Number.isFinite)) {
        events.push({
          type: "nodeMove",
          id: action.id,
          position: action.position,
        });
      }
      break;
    case "reset":
      select(initial.ids, "reset");
      for (const id of seriesIds)
        visibility(id, !initial.hiddenSeriesIds.includes(id), "reset");
      setViewport(initial.viewport, "reset");
      setBrush(null, "reset");
      if (state.tooltip) state = { ...state, tooltip: null };
      break;
  }
  return { state, events };
}

export function zoomDomain(
  domain: Pair,
  anchor: number,
  scale: number,
  integer = false,
): Pair {
  const center = domain[0] * (1 - anchor) + domain[1] * anchor;
  const low = center + (domain[0] - center) * scale;
  const high = center + (domain[1] - center) * scale;
  const next: Pair = integer
    ? [Math.round(low), Math.round(high)]
    : [low, high];
  return validRange(next) ? next : domain;
}
