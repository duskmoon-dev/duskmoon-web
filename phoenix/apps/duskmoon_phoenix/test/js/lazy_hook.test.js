import { expect, mock, test } from "bun:test";
import { lazyHook } from "../../assets/js/lazy_hook.js";

function attach(definition, id) {
  const subscriptions = new Map();
  const element = Object.assign(new EventTarget(), { id, isConnected: true, querySelector: () => null });
  const hook = Object.assign(Object.create(definition), {
    el: element,
    handleEvent: (event, callback) => {
      const ref = Symbol(event);
      subscriptions.set(ref, { event, callback });
      return ref;
    },
    removeHandleEvent: (ref) => subscriptions.delete(ref),
    pushEvent() {},
    pushEventTo() {},
  });

  return {
    hook,
    emit(event, payload) {
      for (const sub of subscriptions.values()) if (sub.event === event) sub.callback(payload);
    },
    subscriptions,
  };
}

test("deduplicates the feature import and ignores a late result for a destroyed mount", async () => {
  const start = Promise.withResolvers();
  const mounted = mock();
  const definition = lazyHook(mock(() => start.promise));
  const first = attach(definition, "old");
  const next = attach(definition, "new");
  first.hook.mounted();
  next.hook.mounted();
  first.hook.destroyed();
  start.resolve({
    mounted() { mounted(this.el.id); },
  });
  await Bun.sleep(0);
  expect(mounted.mock.calls).toEqual([["new"]]);
  next.hook.destroyed();
});

test("replays targeted resets in order and delegates reconnect and cleanup once", async () => {
  const reset = mock();
  const disconnected = mock();
  const reconnected = mock();
  const destroyed = mock();
  const ready = Promise.withResolvers();
  const bridge = attach(lazyHook(() => ready.promise, { events: ["dm:form:reset"] }), "form");
  bridge.hook.mounted();
  bridge.emit("dm:form:reset", { id: "other", values: {} });
  bridge.emit("dm:form:reset", { id: "form", values: { active: false } });
  bridge.emit("dm:form:reset", { id: "form", values: { active: true } });
  bridge.hook.disconnected();
  ready.resolve({
    mounted() { this.ref = this.handleEvent("dm:form:reset", reset); },
    disconnected,
    reconnected,
    destroyed() { this.removeHandleEvent(this.ref); destroyed(); },
  });
  await Bun.sleep(0);
  expect(reset.mock.calls.map(([item]) => item.values)).toEqual([{ active: false }, { active: true }]);
  expect(bridge.subscriptions.size).toBe(1);
  expect(disconnected).toHaveBeenCalledTimes(1);
  bridge.hook.reconnected();
  expect(reconnected).toHaveBeenCalledTimes(1);
  bridge.hook.destroyed();
  expect(destroyed).toHaveBeenCalledTimes(1);
  expect(bridge.subscriptions.size).toBe(0);
});
