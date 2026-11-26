export type Pair<T = number> = readonly [T, T];
export type Domain = Pair | readonly string[] | null;
export type Rect = readonly [
  left: number,
  top: number,
  width: number,
  height: number,
];
export type Time = number | string;
export type Formatter = {
  style: "decimal" | "utc-iso" | "date-time" | "label";
  locale?: string;
  timeZone?: string;
  fractionDigits?: number;
};
type AxisOptions<T> = {
  tickValues?: readonly T[];
  label?: string;
  unit?: string;
  format?: Formatter;
};
export type NumericAxis = AxisOptions<number> & {
  type: "numeric";
  domain?: Pair;
  includeZero?: boolean;
  nice?: boolean;
};
export type TimeAxis = AxisOptions<Time> & {
  type: "time";
  domain?: Pair<Time>;
  nice?: boolean;
};
export type CategoryAxis = AxisOptions<string> & {
  type: "category";
  domain?: readonly string[];
};
export type Axis = NumericAxis | TimeAxis | CategoryAxis;
export type Category = { id: string; label: string };
export type Datum<X extends Time = Time> = {
  id: string;
  x: X | null;
  y: number | null;
  color?: string;
  metadata?: Record<string, unknown>;
};
export type Series<X extends Time = Time> = {
  id: string;
  name: string;
  data: readonly Datum<X>[];
  color?: string;
  paletteSlot?: number;
};
export type Theme = {
  background?: string;
  plotBackground?: string;
  grid?: string;
  axis?: string;
  text?: string;
  mutedText?: string;
  seriesColors?: readonly string[];
  tooltipBackground?: string;
  tooltipText?: string;
  crosshair?: string;
  selection?: string;
  missing?: string;
  heatmapColors?: readonly string[];
};
export type ChartOptions = {
  title?: string;
  description?: string;
  summary?: string;
  revision?: number;
  theme?: Theme;
  selectionMode?: "single" | "multiple";
};
type XYOptions = ChartOptions & {
  hiddenSeriesIds?: readonly string[];
  domainAfterHide?: "all" | "visible";
};
type Marker = {
  visible?: boolean;
  shape?:
    "circle" | "square" | "triangle" | "diamond" | "cross" | "plus" | "star";
  radius?: number;
};
type XYInput<K, X extends Time, A extends Axis, O> = {
  kind: K;
  xAxis: A;
  yAxis: NumericAxis;
  series: readonly Series<X>[];
  options?: XYOptions & O;
};
export type LineInput = XYInput<
  "line",
  Time,
  Axis,
  {
    connectMissing?: boolean;
    sortX?: boolean;
    marker?: Marker;
  }
> & { categories?: readonly Category[] };
export type BarInput = XYInput<
  "bar",
  string,
  CategoryAxis,
  {
    orientation?: "vertical" | "horizontal";
  }
> & { categories?: readonly Category[] };
export type ScatterInput = XYInput<
  "scatter",
  number,
  NumericAxis,
  { marker?: Marker }
>;
export type XYChartInput = LineInput | BarInput | ScatterInput;
export type HeatmapCell = {
  id: string;
  rowId: string;
  columnId: string;
  value: number | null;
  metadata?: Record<string, unknown>;
};
export type HeatmapInput = {
  kind: "heatmap";
  rows: readonly Category[];
  columns: readonly Category[];
  cells: readonly HeatmapCell[];
  options?: ChartOptions & { valueDomain?: Pair; showValues?: boolean };
};

export type Issue = {
  code:
    | "invalidShape"
    | "invalidId"
    | "duplicateId"
    | "unknownReference"
    | "duplicatePosition"
    | "invalidNumber"
    | "invalidTime"
    | "invalidDomain"
    | "invalidFormat"
    | "missingCoordinate"
    | "unsupportedGeometry";
  path: string;
  severity: "error" | "warning";
};

export type PlotDatum = {
  datum: Datum;
  point: Pair;
  rect?: Rect;
  color: string;
};
export type PlotSeries = {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  points: PlotDatum[];
  segments: PlotDatum[][];
};

export type XYLayout = {
  state: "ready" | "empty" | "error";
  issues: Issue[];
  xDomain: Domain;
  yDomain: Pair | null;
  xTicks: readonly Time[];
  yTicks: readonly number[];
  series: PlotSeries[];
  baseline?: number;
};
export type HeatmapLayout = {
  state: XYLayout["state"];
  issues: Issue[];
  valueDomain: Pair | null;
  cells: {
    cell?: HeatmapCell;
    rowId: string;
    columnId: string;
    rect: Rect;
    color: string;
    colorPosition: number | null;
  }[];
};

export type PlotColors = {
  seriesColors: readonly string[];
  heatmapColors: readonly string[];
  missing: string;
};
