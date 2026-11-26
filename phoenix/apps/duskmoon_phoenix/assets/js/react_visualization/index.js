import { createElement } from "react";
import { createRoot } from "react-dom/client";
import {
  DmVizBarChart,
  DmVizHeatmap,
  DmVizLineChart,
  DmVizMapChart,
  DmVizNetworkGraph,
  DmVizScatterChart,
} from "@duskmoon-dev/visualization";

const charts = new Map(Object.entries({
  line: DmVizLineChart,
  bar: DmVizBarChart,
  scatter: DmVizScatterChart,
  heatmap: DmVizHeatmap,
  network: DmVizNetworkGraph,
  map: DmVizMapChart,
}));

const updateEvent = "visualization.update";

/** Create a chart hook. Its React root owns only the dedicated mount child. */
export function createDuskmoonReactVisualization({ mountRoot = createRoot } = {}) {
  return {
    mounted() {
      const mount = this.el.querySelector("[data-dm-visualization-mount]");
      if (!mount) throw new Error("Duskmoon visualization mount element was not found");
      this.visualizationRoot = mountRoot(mount);
      this.visualizationRevision = -1;
      this.visualizationConnected = true;
      this.visualizationUpdate = this.handleEvent(updateEvent, (payload) => {
        if (payload?.id === this.el.id) this.renderVisualization(payload);
      });
      this.updated();
    },

    updated() {
      const raw = this.el.dataset.visualization;
      if (raw) this.renderVisualization(JSON.parse(raw));
    },

    renderVisualization({ chart, revision, selection, viewport, hiddenSeriesIds }) {
      if (!this.visualizationRoot || !Number.isSafeInteger(revision) || revision < 0 ||
          revision <= this.visualizationRevision) return;
      const Component = charts.get(chart?.kind);
      if (!Component) throw new Error("Unsupported Duskmoon visualization chart");
      this.visualizationRevision = revision;
      this.visualizationRoot.render(createElement(Component, {
        chart,
        selection,
        viewport,
        hiddenSeriesIds,
        onEvent: (event) => {
          if (!this.visualizationRoot || !this.visualizationConnected ||
              this.visualizationRevision !== revision ||
              (event.type !== "selection" && event.type !== "brush")) return;
          const payload = { id: this.el.id, revision, event };
          const name = this.el.dataset.event || "visualization.event";
          const target = this.el.dataset.target;
          if (target) this.pushEventTo(target, name, payload);
          else this.pushEvent(name, payload);
        },
      }));
    },

    disconnected() {
      this.visualizationConnected = false;
    },

    reconnected() {
      if (!this.visualizationRoot) return;
      this.visualizationConnected = true;
      this.updated();
      const name = this.el.dataset.syncEvent;
      const target = this.el.dataset.target;
      const payload = { id: this.el.id, revision: this.visualizationRevision };
      if (name && target) this.pushEventTo(target, name, payload);
      else if (name) this.pushEvent(name, payload);
    },

    destroyed() {
      this.visualizationConnected = false;
      if (this.visualizationUpdate != null) this.removeHandleEvent(this.visualizationUpdate);
      this.visualizationUpdate = null;
      const root = this.visualizationRoot;
      this.visualizationRoot = null;
      root?.unmount();
    },
  };
}

export const DuskmoonReactVisualization = createDuskmoonReactVisualization();
