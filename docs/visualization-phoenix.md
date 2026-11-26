# Use Duskmoon React charts in Phoenix LiveView

Install matching versions of `duskmoon_phoenix` and
`@duskmoon-dev/visualization`, plus React 19 and React DOM 19, in the
application's asset workspace. Load Duskmoon Core styles for the theme.

Add the visualization hook to the hooks passed to the application's LiveSocket.
Applications with existing hooks can merge it into their current hook map.

```js
import { DuskmoonReactVisualization } from "duskmoon_phoenix/react-visualization";

const hooks = { ...otherHooks, DuskmoonReactVisualization };
```

Import `DuskmoonPhoenix.Component.DataDisplay.ReactVisualization` into the
LiveView or its HTML module and render the component with a contract chart
map such as a line chart with `kind`, `xAxis`, `yAxis`, and `series`.

```heex
<.dm_react_visualization
  id="requests-chart"
  chart={@chart}
  revision={@revision}
  sync_event="requests.sync"
/>
```

Increment the revision for each snapshot, including controlled selection,
viewport, and series visibility updates. You can patch the assigns or use
`push_event(socket, "visualization.update", %{id: id, chart: chart, revision: revision})`.
Push payloads can also include `selection`, `viewport`, and `hiddenSeriesIds`.

The hook sends selection and brush events under `visualization.event`.
The payload includes chart ID, revision, and the original chart event. Validate
the ID and revision when matching events on the server. Use the `event`
attribute to change the name and `target` to route it to a LiveComponent.
If you provide a sync event, handle it by returning the latest snapshot.

The `/storybook/data_display/react_visualization` example shows the chart
updating after a LiveView button click and reports selection and brushing.
Storybook loads the React entry when a React hook mounts.
