# Duskmoon Visualization for React

The standalone React package exports `DmVizLineChart`, `DmVizBarChart`,
`DmVizScatterChart`, `DmVizHeatmap`, `DmVizNetworkGraph`, and
`DmVizMapChart`. Each takes a chart input, an optional
fixed `width`, a plot `height` (300 by default) and an optional `loading` state.
Without a fixed width, the chart measures its container on the client.

```tsx
import { DmVizLineChart } from "@duskmoon-dev/visualization";

<DmVizLineChart
  chart={{
    kind: "line",
    xAxis: { type: "category" },
    yAxis: { type: "numeric", unit: "ms" },
    series: [
      {
        id: "latency",
        name: "Latency",
        data: [
          { id: "mon", x: "Mon", y: 15 },
          { id: "tue", x: "Tue", y: null },
          { id: "wed", x: "Wed", y: 17 },
          { id: "thu", x: "Thu", y: 19 },
        ],
      },
    ],
    options: { title: "Request latency", marker: { visible: true } },
  }}
/>;
```

Charts use the Duskmoon Core CSS color variables when available. Supply
`chart.options.theme` to override colors for an individual chart. Chart
inputs follow the [shared contract](https://github.com/duskmoon-dev/duskmoon-web/tree/main/specs/visualization/v1).

| Component | Chart input and interactions |
| --- | --- |
| Line | Use numeric, time, or category x values. Null y values break the line. Numeric and time axes support zoom and x-range selection. |
| Bar | Use category IDs as x. Group series vertically or horizontally around the zero baseline. |
| Scatter | Give each point a stable ID and use numeric x/y values. Zoom applies to both axes. |
| Heatmap | Supply ordered rows and columns plus cells addressed by their IDs. Use continuous color stops for measured values and a separate color for missing values. |
| Network | Supply fixed x/y coordinates and stable node and edge IDs. The scene supports pan, zoom, and node drag. |
| Map | Supply offline GeoJSON with stable feature IDs. Mercator supports Polygon, MultiPolygon, and Point within ±85° latitude and without antimeridian crossings. |

Inspect a mark by hovering, tapping, or focusing the plot and pressing arrow
keys. Enter or Space selects the focused mark. Use Shift with Left/Right to
brush a numeric or time line, Shift with arrows to pan a scene, and Alt with
arrows to move the focused network node. The chart toolbar provides zoom,
clear, and reset controls where applicable. The chart's data disclosure
shows raw values, including hidden series and missing values.

Pass `onEvent` to receive `VizEvent` values. Provide `selection`,
`hiddenSeriesIds`, or `viewport` independently to control that state and
write the emitted value back from your application. Uncontrolled selection
can be seeded with `defaultSelection`. Keep IDs stable when updating data.

The gallery uses the contract fixtures. The contract's capability matrix
lists extensions such as stacked bars, force layout, and map tiles.
See [Phoenix LiveView setup](https://github.com/duskmoon-dev/duskmoon-web/blob/main/docs/visualization-phoenix.md).
