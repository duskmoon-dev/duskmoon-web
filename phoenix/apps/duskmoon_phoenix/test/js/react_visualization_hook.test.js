import { describe, expect, test } from "bun:test";
import { createDuskmoonReactVisualization } from "../../assets/js/react_visualization/index.js";

const chart = { kind: "line", xAxis: { type: "numeric" }, yAxis: { type: "numeric" }, series: [] };

function mount(id) {
  const renders = [];
  const sent = [];
  const handlers = new Map();
  const child = {};
  let unmounts = 0;
  const context = Object.create(createDuskmoonReactVisualization({
    mountRoot(node) {
      expect(node).toBe(child);
      return { render: (tree) => renders.push(tree), unmount: () => unmounts++ };
    },
  }));
  context.el = {
    id, dataset: { visualization: JSON.stringify({ chart, revision: 1 }), syncEvent: "visualization.sync" },
    querySelector: () => child,
  };
  context.handleEvent = (name, callback) => {
    handlers.set(name, callback);
    return name;
  };
  context.removeHandleEvent = (ref) => handlers.delete(ref);
  context.pushEvent = (name, event) => sent.push([name, event]);
  context.mounted();
  return { context, renders, sent, handlers, unmounts: () => unmounts };
}

describe("React visualization bridge", () => {
  test("mounts once, applies only fresh targeted revisions and cleans up", () => {
    const left = mount("left");
    const right = mount("right");
    const update = (payload) => {
      for (const item of [left, right]) item.handlers.get("visualization.update")(payload);
    };
    update({ id: "left", revision: 3, chart: { ...chart, options: { title: "New" } }, selection: [] });
    update({ id: "left", revision: 2, chart });
    expect(left.renders.map((tree) => tree.props.chart.options?.title)).toEqual([undefined, "New"]);
    expect(left.renders.at(-1).props.selection).toEqual([]);
    expect(right.renders).toHaveLength(1);
    left.context.destroyed();
    left.context.destroyed();
    expect(left.handlers.size).toBe(0);
    expect(left.unmounts()).toBe(1);
    expect(right.unmounts()).toBe(0);
  });

  test("forwards selection and brush only while connected and requests a snapshot on reconnect", () => {
    const { context, renders, sent } = mount("chart");
    const send = renders[0].props.onEvent;
    send({ type: "tooltip" });
    send({ type: "viewport" });
    send({ type: "selection", ids: [], reason: "clear" });
    context.disconnected();
    send({ type: "brush", range: [1, 2], reason: "brush" });
    context.reconnected();
    expect(sent).toEqual([
      ["visualization.event", { id: "chart", revision: 1, event: { type: "selection", ids: [], reason: "clear" } }],
      ["visualization.sync", { id: "chart", revision: 1 }],
    ]);
  });
});
