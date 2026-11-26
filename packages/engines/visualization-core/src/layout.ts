import {
  clampUnit,
  continuousDomain,
  normalizeAxisValue,
  normalizePosition,
  validateAxisFormat,
  validDomain,
} from "./axis.js";
import { sampleColor, seriesHash } from "./color.js";
import type {
  Axis,
  Datum,
  HeatmapInput,
  HeatmapLayout,
  Issue,
  Pair,
  PlotColors,
  PlotDatum,
  Rect,
  Time,
  XYChartInput,
  XYLayout,
} from "./model.js";

function addIssue(
  issues: Issue[],
  code: Issue["code"],
  path: string,
  severity: Issue["severity"] = "error",
): void {
  issues.push({ code, path, severity });
}

function recordId(
  ids: Set<string>,
  id: string,
  path: string,
  issues: Issue[],
): void {
  if (typeof id !== "string" || !id) addIssue(issues, "invalidShape", path);
  else if (/[\uD800-\uDFFF]/u.test(id)) addIssue(issues, "invalidId", path);
  if (ids.has(id)) addIssue(issues, "duplicateId", path);
  ids.add(id);
}

function domainForAxis(
  values: readonly number[],
  axis: Exclude<Axis, { type: "category" }>,
  path: string,
  issues: Issue[],
  forceZero = false,
): Pair | null {
  if (axis.domain) {
    const [low, high] = axis.domain.map((value, index) =>
      normalizeAxisValue(value, axis, path + "/domain/" + index, issues),
    );
    if (typeof low !== "number" || typeof high !== "number") return null;
    if (!validDomain([low, high])) {
      addIssue(issues, "invalidDomain", path + "/domain");
      return null;
    }
    return [low, high];
  }
  const domain = continuousDomain(values, {
    includeZero: forceZero || (axis.type === "numeric" && axis.includeZero),
    time: axis.type === "time",
    nice: axis.nice,
  });
  if (!domain && values.length > 0)
    addIssue(issues, "invalidNumber", path + "/domain");
  return domain;
}

function within(value: number, domain: Pair): boolean {
  return domain[0] <= value && value <= domain[1];
}

function numericTicks(
  domain: Pair | null,
  axis: Exclude<Axis, { type: "category" }>,
  path: string,
  issues: Issue[],
): number[] {
  if (!axis.tickValues) return domain ? [...domain] : [];
  return axis.tickValues.flatMap((value, index) => {
    const normalized = normalizeAxisValue(
      value,
      axis,
      path + "/tickValues/" + index,
      issues,
    );
    return typeof normalized === "number" &&
      domain &&
      within(normalized, domain)
      ? [normalized]
      : [];
  });
}

const fallbackColors: PlotColors = {
  seriesColors: [
    "#005AC1",
    "#565E71",
    "#705574",
    "#D8E2FF",
    "#DAE2F9",
    "#FAD9FC",
  ],
  heatmapColors: ["#E3E2E6", "#005AC1"],
  missing: "#E3E2E6",
};

type NormalizedPoint = { datum: Datum; x: Time | null; y: number | null };

function lineSegments(
  entries: readonly NormalizedPoint[],
  project: (entry: NormalizedPoint) => PlotDatum | null,
  sortKey: (x: Time) => number,
  sortX: boolean,
  connectMissing: boolean,
): PlotDatum[][] {
  const segments: PlotDatum[][] = [];
  let run: NormalizedPoint[] = [];
  let segment: PlotDatum[] = [];
  const finishSegment = () => {
    if (segment.length) segments.push(segment);
    segment = [];
  };
  const finishRun = () => {
    if (sortX) run.sort((left, right) => sortKey(left.x!) - sortKey(right.x!));
    for (const entry of run) {
      const point = project(entry);
      if (point) segment.push(point);
      else if (entry.y !== null || !connectMissing) finishSegment();
    }
    finishSegment();
    run = [];
  };
  for (const entry of entries) {
    if (entry.x === null) finishRun();
    else run.push(entry);
  }
  finishRun();
  return segments;
}

export function layoutXY(
  input: XYChartInput,
  defaults: PlotColors = fallbackColors,
): XYLayout {
  const issues: Issue[] = [];
  const { xAxis, yAxis, options } = input;
  const hidden = new Set(options?.hiddenSeriesIds);
  const seriesIds = new Set<string>();
  const seriesColors = options?.theme?.seriesColors ?? defaults.seriesColors;
  if (!seriesColors.length)
    addIssue(issues, "invalidShape", "/options/theme/seriesColors");
  const xValues: number[] = [];
  const yValues: number[] = [];
  const categories = new Set<string>();
  validateAxisFormat(xAxis, "/xAxis", issues);
  validateAxisFormat(yAxis, "/yAxis", issues);

  const normalized = input.series.map((series, index) => {
    const path = "/series/" + index;
    recordId(seriesIds, series.id, path + "/id", issues);
    const ids = new Set<string>();
    const barCategories = new Set<string>();
    const include =
      options?.domainAfterHide !== "visible" || !hidden.has(series.id);
    return series.data.map((datum, datumIndex): NormalizedPoint => {
      const itemPath = path + "/data/" + datumIndex;
      recordId(ids, datum.id, itemPath + "/id", issues);
      const x =
        datum.x === null
          ? null
          : normalizeAxisValue(datum.x, xAxis, itemPath + "/x", issues);
      const { y } = datum;
      if (y !== null && !Number.isFinite(y))
        addIssue(issues, "invalidNumber", itemPath + "/y");
      if (input.kind === "scatter" && (datum.x === null || y === null)) {
        addIssue(issues, "missingCoordinate", itemPath, "warning");
      }
      if (typeof x === "string") {
        if (include) categories.add(x);
        if (input.kind === "bar" && barCategories.has(x))
          addIssue(issues, "duplicatePosition", itemPath + "/x");
        barCategories.add(x);
      }
      if (include && x !== null && y !== null && Number.isFinite(y)) {
        if (typeof x === "number") xValues.push(x);
        yValues.push(y);
      }
      return { datum, x, y };
    });
  });

  for (const [index, id] of (options?.hiddenSeriesIds ?? []).entries()) {
    if (!seriesIds.has(id))
      addIssue(issues, "unknownReference", "/options/hiddenSeriesIds/" + index);
  }
  if ("categories" in input) {
    const ids = new Set<string>();
    input.categories?.forEach(({ id }, index) =>
      recordId(ids, id, `/categories/${index}/id`, issues),
    );
  }

  const xDomain =
    xAxis.type === "category"
      ? [...(xAxis.domain ?? categories)]
      : domainForAxis(xValues, xAxis, "/xAxis", issues);
  const yDomain = domainForAxis(
    yValues,
    yAxis,
    "/yAxis",
    issues,
    input.kind === "bar",
  );
  const categoryIndex = new Map<string, number>(
    xAxis.type === "category"
      ? (xDomain as string[]).map((id, index) => [id, index])
      : [],
  );
  const xTicks =
    xAxis.type === "category"
      ? [
          ...(xAxis.tickValues?.filter((id) => categoryIndex.has(id)) ??
            categoryIndex.keys()),
        ]
      : numericTicks(xDomain as Pair | null, xAxis, "/xAxis", issues);
  const yTicks = numericTicks(yDomain, yAxis, "/yAxis", issues);
  if (issues.some(({ severity }) => severity === "error")) {
    return {
      state: "error",
      issues,
      xDomain: null,
      yDomain: null,
      xTicks: [],
      yTicks: [],
      series: [],
    };
  }

  const visibleCount = input.series.length - hidden.size;
  let visibleIndex = 0;
  const horizontal =
    input.kind === "bar" && input.options?.orientation === "horizontal";
  const zero = yDomain ? clampUnit(normalizePosition(0, yDomain)) : 0;
  const baseline =
    input.kind === "bar" ? (horizontal ? zero : 1 - zero) : undefined;
  const sortKey = (x: Time) =>
    typeof x === "number" ? x : (categoryIndex.get(x) ?? Infinity);

  const plotted = input.series.map((series, index) => {
    const visible = !hidden.has(series.id);
    const slot = visible ? visibleIndex++ : 0;
    const color =
      series.color ??
      seriesColors[
        (series.paletteSlot ?? seriesHash(series.id)) % seriesColors.length
      ];
    const project = ({ datum, x, y }: NormalizedPoint): PlotDatum | null => {
      if (!visible || !xDomain || !yDomain || x === null || y === null)
        return null;
      const category = typeof x === "string" ? categoryIndex.get(x) : undefined;
      if (typeof x === "string" && category === undefined) return null;
      const yRatio = normalizePosition(y, yDomain);
      const xRatio =
        category === undefined
          ? normalizePosition(Number(x), xDomain as Pair)
          : (category + 0.5) / categoryIndex.size;
      if (input.kind !== "bar")
        return {
          datum,
          point: [xRatio, 1 - yRatio],
          color: datum.color ?? color,
        };

      const width = 1 / categoryIndex.size / visibleCount;
      const categoryStart = (category! * visibleCount + slot) * width;
      const end = clampUnit(yRatio);
      const start = Math.min(zero, end);
      const length = Math.abs(end - zero);
      const rect: Rect = horizontal
        ? [start, categoryStart, length, width]
        : [categoryStart, 1 - Math.max(zero, end), width, length];
      const point: Pair = horizontal
        ? [end, categoryStart + width / 2]
        : [categoryStart + width / 2, 1 - end];
      return { datum, point, rect, color: datum.color ?? color };
    };

    const segments =
      input.kind === "line" && visible
        ? lineSegments(
            normalized[index],
            project,
            sortKey,
            input.options?.sortX ?? false,
            input.options?.connectMissing ?? false,
          )
        : [];
    const points =
      input.kind === "line"
        ? segments.flat()
        : normalized[index].flatMap((entry) => {
            const point = project(entry);
            return point ? [point] : [];
          });
    return {
      id: series.id,
      name: series.name,
      color,
      visible,
      points,
      segments,
    };
  });

  const state = plotted.some(({ points }) => points.length) ? "ready" : "empty";
  return {
    state,
    issues,
    xDomain,
    yDomain,
    xTicks,
    yTicks,
    series: plotted,
    baseline,
  };
}

export function layoutHeatmap(
  input: HeatmapInput,
  defaults: PlotColors = fallbackColors,
): HeatmapLayout {
  const issues: Issue[] = [];
  const { options, rows, columns } = input;
  const cellIds = new Set<string>();
  const rowIds = new Set<string>();
  const columnIds = new Set<string>();
  const stops = options?.theme?.heatmapColors ?? defaults.heatmapColors;
  if (stops.length < 2)
    addIssue(issues, "invalidShape", "/options/theme/heatmapColors");
  rows.forEach(({ id }, index) =>
    recordId(rowIds, id, `/rows/${index}/id`, issues),
  );
  columns.forEach(({ id }, index) =>
    recordId(columnIds, id, `/columns/${index}/id`, issues),
  );
  const byRow = new Map(
    rows.map(({ id }) => [
      id,
      new Map<string, HeatmapInput["cells"][number]>(),
    ]),
  );
  let minimum = Infinity;
  let maximum = -Infinity;
  input.cells.forEach((cell, index) => {
    const path = "/cells/" + index;
    recordId(cellIds, cell.id, path + "/id", issues);
    const row = byRow.get(cell.rowId);
    if (!row) addIssue(issues, "unknownReference", path + "/rowId");
    if (!columnIds.has(cell.columnId))
      addIssue(issues, "unknownReference", path + "/columnId");
    if (row?.has(cell.columnId))
      addIssue(issues, "duplicatePosition", path + "/columnId");
    row?.set(cell.columnId, cell);
    if (cell.value === null) return;
    if (!Number.isFinite(cell.value))
      addIssue(issues, "invalidNumber", path + "/value");
    else {
      minimum = Math.min(minimum, cell.value);
      maximum = Math.max(maximum, cell.value);
    }
  });
  const hasValue = minimum <= maximum;
  const valueDomain = continuousDomain(hasValue ? [minimum, maximum] : [], {
    explicit: options?.valueDomain,
  });
  if (!valueDomain && (hasValue || options?.valueDomain)) {
    addIssue(
      issues,
      options?.valueDomain ? "invalidDomain" : "invalidNumber",
      "/options/valueDomain",
    );
  }
  if (issues.length)
    return { state: "error", issues, valueDomain: null, cells: [] };

  const missing = options?.theme?.missing ?? defaults.missing;
  const cells = rows.flatMap((row, rowIndex) =>
    columns.map((column, columnIndex) => {
      const cell = byRow.get(row.id)!.get(column.id);
      const rect: Rect = [
        columnIndex / columns.length,
        rowIndex / rows.length,
        1 / columns.length,
        1 / rows.length,
      ];
      const value = cell?.value;
      const colorPosition =
        value == null || !valueDomain
          ? null
          : !options?.valueDomain && minimum === maximum
            ? 0.5
            : clampUnit(normalizePosition(value, valueDomain));
      const color =
        colorPosition === null ? missing : sampleColor(stops, colorPosition);
      return {
        cell,
        rowId: row.id,
        columnId: column.id,
        rect,
        color,
        colorPosition,
      };
    }),
  );
  return { state: hasValue ? "ready" : "empty", issues, valueDomain, cells };
}
