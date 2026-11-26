import type { ChartOptions, Issue, Pair } from "./model.js";
import type { VizViewport } from "./interaction.js";

export type NetworkNode = {
  id: string;
  x: number;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, unknown>;
};

export type NetworkEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  color?: string;
  metadata?: Record<string, unknown>;
};

export type NetworkInput = {
  kind: "network";
  nodes: readonly NetworkNode[];
  edges: readonly NetworkEdge[];
  options?: ChartOptions;
};

export type GeoPolygon = readonly (readonly Pair[])[];
export type MapGeometry =
  | { type: "Point"; coordinates: Pair }
  | { type: "Polygon"; coordinates: GeoPolygon }
  | { type: "MultiPolygon"; coordinates: readonly GeoPolygon[] };

export type MapFeature = {
  type: "Feature";
  id: string;
  geometry: MapGeometry;
  properties: (Record<string, unknown> & { value?: number }) | null;
};

export type MapInput = {
  kind: "map";
  geoJson: { type: "FeatureCollection"; features: readonly MapFeature[] };
  options?: ChartOptions & {
    projection?: "mercator";
    center?: Pair;
    padding?: number;
  };
};

type SceneViewport = Extract<VizViewport, { center: Pair }>;
type Bounds = { low: Pair; high: Pair };
type SceneFit = {
  center: Pair;
  scale: number;
};
type NetworkScene = {
  issues: Issue[];
  bounds: Bounds | null;
  initialViewport: SceneViewport | null;
  nodes: ReadonlyMap<string, NetworkNode>;
  edges: readonly NetworkEdge[];
};
type ProjectedFeature = {
  source: MapFeature;
  point?: Pair;
  polygons?: readonly GeoPolygon[];
};
type MapScene = {
  issues: Issue[];
  bounds: Bounds | null;
  initialViewport: SceneViewport | null;
  features: readonly ProjectedFeature[];
};

function trackId(
  known: Set<string>,
  id: string,
  path: string,
  issues: Issue[],
) {
  if (typeof id !== "string" || !id)
    issues.push({ code: "invalidShape", path, severity: "error" });
  else if (/[\uD800-\uDFFF]/u.test(id))
    issues.push({ code: "invalidId", path, severity: "error" });
  if (known.has(id))
    issues.push({ code: "duplicateId", path, severity: "error" });
  known.add(id);
}

function measuredBounds(input: Iterable<Pair>): Bounds | null {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const [x, y] of input) {
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x);
    bottom = Math.max(bottom, y);
  }
  return left === Infinity ? null : { low: [left, top], high: [right, bottom] };
}

function midpoint({ low, high }: Bounds): Pair {
  return [low[0] / 2 + high[0] / 2, low[1] / 2 + high[1] / 2];
}

export function networkScene(input: NetworkInput): NetworkScene {
  const issues: Issue[] = [];
  const nodeIds = new Set<string>();
  const nodes = new Map<string, NetworkNode>();
  for (const [index, node] of input.nodes.entries()) {
    const path = "/nodes/" + index;
    trackId(nodeIds, node.id, path + "/id", issues);
    if (!Number.isFinite(node.x))
      issues.push({
        code: "invalidNumber",
        path: path + "/x",
        severity: "error",
      });
    if (!Number.isFinite(node.y))
      issues.push({
        code: "invalidNumber",
        path: path + "/y",
        severity: "error",
      });
    nodes.set(node.id, node);
  }
  const edgeIds = new Set<string>();
  input.edges.forEach((edge, index) => {
    const path = "/edges/" + index;
    trackId(edgeIds, edge.id, path + "/id", issues);
    for (const endpoint of ["source", "target"] as const) {
      if (!nodes.has(edge[endpoint]))
        issues.push({
          code: "unknownReference",
          path: path + "/" + endpoint,
          severity: "error",
        });
    }
  });
  const bounds = issues.length
    ? null
    : measuredBounds(input.nodes.map(({ x, y }) => [x, y]));
  return {
    issues,
    bounds,
    nodes,
    edges: input.edges,
    initialViewport: bounds && {
      kind: "network",
      center: midpoint(bounds),
      zoom: 1,
    },
  };
}

const radians = Math.PI / 180;
export function projectMercator([longitude, latitude]: Pair): Pair {
  return [longitude * radians, -Math.asinh(Math.tan(latitude * radians))];
}

export function unprojectMercator([x, y]: Pair): Pair {
  return [x / radians, y === 0 ? 0 : -Math.atan(Math.sinh(y)) / radians];
}

function geoPosition(point: Pair): boolean {
  return (
    Array.isArray(point) &&
    point.length === 2 &&
    point.every(Number.isFinite) &&
    Math.abs(point[0]) <= 180 &&
    Math.abs(point[1]) <= 85
  );
}

function validRing(ring: readonly Pair[]): boolean {
  return (
    ring.length >= 4 &&
    ring.every(
      (point, index) =>
        geoPosition(point) &&
        (index === 0 || Math.abs(point[0] - ring[index - 1][0]) <= 180),
    ) &&
    ring[0][0] === ring.at(-1)![0] &&
    ring[0][1] === ring.at(-1)![1]
  );
}

export function mapScene(input: MapInput): MapScene {
  const issues: Issue[] = [];
  const ids = new Set<string>();
  const features: ProjectedFeature[] = [];
  const points: Pair[] = [];
  function geometryIssue(path: string) {
    issues.push({ code: "unsupportedGeometry", path, severity: "error" });
  }
  const specified = input.options?.center;
  if (specified && !geoPosition(specified)) geometryIssue("/options/center");
  const padding = input.options?.padding;
  if (padding !== undefined && (!Number.isFinite(padding) || padding < 0)) {
    issues.push({
      code: "invalidShape",
      path: "/options/padding",
      severity: "error",
    });
  }

  input.geoJson.features.forEach((source, index) => {
    const path = "/geoJson/features/" + index;
    trackId(ids, source.id, path + "/id", issues);
    if (
      source.properties?.value !== undefined &&
      !Number.isFinite(source.properties.value)
    ) {
      issues.push({
        code: "invalidNumber",
        path: path + "/properties/value",
        severity: "error",
      });
    }
    const geometry = source.geometry;
    const coordinatesPath = path + "/geometry/coordinates";
    switch (geometry.type) {
      case "Point": {
        if (!geoPosition(geometry.coordinates)) {
          geometryIssue(coordinatesPath);
          return;
        }
        const point = projectMercator(geometry.coordinates);
        points.push(point);
        features.push({ source, point });
        return;
      }
      case "Polygon":
      case "MultiPolygon": {
        const polygons =
          geometry.type === "Polygon"
            ? [geometry.coordinates]
            : geometry.coordinates;
        if (polygons.length === 0) geometryIssue(coordinatesPath);
        const projected = polygons.flatMap((polygon, polygonIndex) => {
          const polygonPath =
            geometry.type === "Polygon"
              ? coordinatesPath
              : coordinatesPath + "/" + polygonIndex;
          if (polygon.length === 0) geometryIssue(polygonPath);
          const rings = polygon.flatMap((ring, ringIndex) => {
            if (!validRing(ring)) {
              geometryIssue(polygonPath + "/" + ringIndex);
              return [];
            }
            return [ring.map(projectMercator)];
          });
          if (!rings.length) return [];
          for (const point of rings[0]) points.push(point);
          return [rings];
        });
        features.push({ source, polygons: projected });
        return;
      }
      default:
        geometryIssue(path + "/geometry");
    }
  });
  const bounds = issues.length ? null : measuredBounds(points);
  return {
    issues,
    bounds,
    features,
    initialViewport: bounds && {
      kind: "map",
      center: specified ?? unprojectMercator(midpoint(bounds)),
      zoom: 1,
    },
  };
}

export function fitScene(
  bounds: Bounds,
  initial: SceneViewport,
  width: number,
  height: number,
  padding = initial.kind === "map" ? 16 : 0,
): SceneFit | null {
  const center =
    initial.kind === "map" ? projectMercator(initial.center) : initial.center;
  const span = (axis: 0 | 1) =>
    Math.max(
      center[axis] - bounds.low[axis],
      bounds.high[axis] - center[axis],
    ) * 2 || (initial.kind === "network" ? 2 : 1);
  const scale = Math.min(
    (width - 2 * padding) / span(0),
    (height - 2 * padding) / span(1),
  );
  return Number.isFinite(scale) && scale > 0 ? { center, scale } : null;
}

export function sceneTransform(
  fit: SceneFit,
  viewport: SceneViewport,
  width: number,
  height: number,
) {
  const center =
    viewport.kind === "map"
      ? projectMercator(viewport.center)
      : viewport.center;
  const scale = fit.scale * viewport.zoom;
  return {
    scale,
    forward: ([x, y]: Pair): Pair => [
      (x - center[0]) * scale + width / 2,
      (y - center[1]) * scale + height / 2,
    ],
    inverse: ([x, y]: Pair): Pair => [
      (x - width / 2) / scale + center[0],
      (y - height / 2) / scale + center[1],
    ],
  };
}

export function segmentDistance(point: Pair, start: Pair, end: Pair): number {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dx, dy);
  if (!length || !Number.isFinite(length))
    return Math.hypot(point[0] - start[0], point[1] - start[1]);
  const ux = dx / length;
  const uy = dy / length;
  const along = Math.max(
    0,
    Math.min(length, (point[0] - start[0]) * ux + (point[1] - start[1]) * uy),
  );
  return Math.hypot(
    point[0] - start[0] - along * ux,
    point[1] - start[1] - along * uy,
  );
}

function inRing(point: Pair, ring: readonly Pair[]): boolean {
  let inside = false;
  for (let index = 1; index < ring.length; index++) {
    const a = ring[index - 1];
    const b = ring[index];
    if (segmentDistance(point, a, b) <= 1e-12) return true;
    if (
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < a[0] + ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1])
    )
      inside = !inside;
  }
  return inside;
}

export function hitMap(
  scene: MapScene,
  point: Pair,
  pointRadius: number,
): MapFeature | undefined {
  for (let index = scene.features.length - 1; index >= 0; index--) {
    const feature = scene.features[index];
    if (
      feature.point &&
      Math.hypot(point[0] - feature.point[0], point[1] - feature.point[1]) <=
        pointRadius
    ) {
      return feature.source;
    }
  }
  for (let index = scene.features.length - 1; index >= 0; index--) {
    const feature = scene.features[index];
    if (
      feature.polygons?.some(
        ([outer, ...holes]) =>
          inRing(point, outer) && !holes.some((hole) => inRing(point, hole)),
      )
    )
      return feature.source;
  }
}
