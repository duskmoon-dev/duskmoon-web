/**
 * Defer an explicit React feature import until a matching LiveView hook mounts.
 * The loader is shared across instances. Lifecycle and queued updates belong to
 * each hook element.
 */
export function lazyHook(load, {
  events = [],
  synchronize = false,
} = {}) {
  let modulePromise;
  const fetchHook = () => {
    modulePromise ??= Promise.resolve().then(load).catch((error) => {
      modulePromise = undefined;
      throw error;
    });
    return modulePromise;
  };

  return {
    mounted() {
      const state = {
        status: this.el.querySelector("[data-dm-hook-status]"),
        pendingForm: this.el.querySelector("[data-dm-react-form]"),
        events: new Map(),
        queued: [],
        connected: true,
      };
      this.lazyState = state;
      if (state.pendingForm) state.pendingForm.inert = true;
      // Reject ordinary HTML form submission until React takes over transport.
      state.preventSubmit = (event) => event.preventDefault();
      this.el.addEventListener("submit", state.preventSubmit, true);

      for (const event of events) {
        state.events.set(event, this.handleEvent(event, (payload) => {
          if (payload?.id === this.el.id) state.queued.push([event, payload]);
        }));
      }
      this.loadFeature();
    },

    async loadFeature() {
      const state = this.lazyState;
      if (state.loading || state.hook) return;
      state.loading = true;
      if (state.status) {
        state.status.hidden = false;
        state.status.textContent = state.status.dataset.loading || "Loading…";
      }

      try {
        const hook = await fetchHook();
        if (this.lazyState !== state || !this.el.isConnected) return;

        for (const ref of state.events.values()) this.removeHandleEvent(ref);
        state.events.clear();
        state.handlers = new Map();

        const implementation = Object.create(hook);
        implementation.el = this.el;
        implementation.pushEvent = this.pushEvent.bind(this);
        implementation.pushEventTo = this.pushEventTo.bind(this);
        implementation.removeHandleEvent = (ref) => this.removeHandleEvent(ref);
        implementation.handleEvent = (event, handler) => {
          state.handlers.set(event, handler);
          return this.handleEvent(event, handler);
        };
        state.hook = implementation;

        implementation.mounted?.();
        for (const [event, payload] of state.queued) state.handlers.get(event)?.(payload);
        state.queued.length = 0;
        if (!state.connected) implementation.disconnected?.();
        else if (synchronize) implementation.reconnected?.();
        this.el.removeEventListener("submit", state.preventSubmit, true);
        if (state.pendingForm) state.pendingForm.inert = false;
        if (state.status) state.status.hidden = true;
      } catch (error) {
        if (this.lazyState !== state || !this.el.isConnected) return;
        state.hook?.destroyed?.();
        state.hook = null;
        console.error("[Duskmoon] Interactive controls failed to load", error);
        if (state.status) {
          state.status.hidden = false;
          const retry = this.el.ownerDocument.createElement("button");
          retry.type = "button";
          retry.className = "btn btn-sm";
          retry.textContent = "Retry";
          retry.addEventListener("click", () => this.loadFeature(), { once: true });
          state.status.replaceChildren("Interactive controls unavailable. ", retry);
        }
      } finally {
        state.loading = false;
      }
    },

    updated() {
      this.lazyState.hook?.updated?.();
    },

    disconnected() {
      this.lazyState.connected = false;
      this.lazyState.hook?.disconnected?.();
    },

    reconnected() {
      this.lazyState.connected = true;
      this.lazyState.hook?.reconnected?.();
    },

    destroyed() {
      const state = this.lazyState;
      this.lazyState = null;
      this.el.removeEventListener("submit", state.preventSubmit, true);
      for (const ref of state.events.values()) this.removeHandleEvent(ref);
      state.hook?.destroyed?.();
    },
  };
}
