/** Explicit LiveView hooks for integrated Duskmoon Custom Elements. */

/** Standard duskmoon-elements event names for automatic forwarding */
const DM_EVENTS = [
  "dm-click", "dm-change", "dm-input", "dm-focus", "dm-blur",
  "dm-submit", "dm-select", "dm-close", "dm-open", "dm-toggle",
];

/**
 * WebComponentHook - Universal LiveView ↔ Custom Element bridge
 *
 * This hook enables seamless communication between Phoenix LiveView
 * and duskmoon-elements custom elements (el-dm-*).
 *
 * ## Event Bridging Patterns
 *
 * ### Forward custom element events to LiveView:
 * Use `duskmoon-send-{event}` attribute:
 * ```html
 * <el-dm-button duskmoon-send-click="handle_click">Click me</el-dm-button>
 * ```
 *
 * ### Receive LiveView events in custom element:
 * Use `duskmoon-receive-{event}` attribute:
 * ```html
 * <el-dm-input duskmoon-receive-reset="reset">Input</el-dm-input>
 * ```
 *
 * ### Automatic dm-* event forwarding:
 * Events prefixed with `dm-` (dm-click, dm-change, dm-input, etc.)
 * are automatically forwarded to LiveView when corresponding
 * `phx-{event}` attribute exists.
 *
 * ## Usage in Phoenix templates:
 * ```heex
 * <el-dm-button
 *   phx-hook="WebComponentHook"
 *   phx-click="button_clicked"
 *   variant="primary"
 * >
 *   Click me
 * </el-dm-button>
 * ```
 */
export const WebComponentHook = {
  mounted() {
    this._setupEventBridging();
    this._setupAutomaticForwarding();
  },

  updated() {
    this._clearEventBridging();
    this._setupEventBridging();
  },

  destroyed() {
    this._clearEventBridging();
    for (const [event, listener] of this._automaticListeners) {
      this.el.removeEventListener(event, listener);
    }
  },

  _clearEventBridging() {
    for (const { event, listener } of this._sendListeners) {
      this.el.removeEventListener(event, listener);
    }
    for (const ref of this._receiveListeners) this.removeHandleEvent(ref);
  },

  /**
   * Setup explicit event bridging via duskmoon-send-* and duskmoon-receive-* attributes
   */
  _setupEventBridging() {
    this._sendListeners = [];
    this._receiveListeners = [];
    const attrs = this.el.attributes;
    const phxTarget = this.el.getAttribute("phx-target");

    // Helper to push events with optional target
    const pushEvent = (event, payload, callback) => {
      if (phxTarget) {
        this.pushEventTo(phxTarget, event, payload, callback);
      } else {
        this.pushEvent(event, payload, callback);
      }
    };

    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];

      // Handle duskmoon-send-{event}="{phxEvent};{optionalCallback}"
      if (/^duskmoon-send-/.test(attr.name)) {
        const eventName = attr.name.replace(/^duskmoon-send-/, "");
        const [phxEvent, callbackName] = attr.value.split(";");

        const listener = ({ detail }) => {
          pushEvent(phxEvent, detail || {}, (response) => {
            if (callbackName && typeof this[callbackName] === "function") {
              this[callbackName](response, detail, eventName);
            }
          });
        };
        this.el.addEventListener(eventName, listener);
        this._sendListeners.push({ event: eventName, listener });
      }

      // Handle duskmoon-receive-{event}="{handlerMethodOrEmpty}"
      if (/^duskmoon-receive-/.test(attr.name)) {
        const eventName = attr.name.replace(/^duskmoon-receive-/, "");
        const handler = attr.value;

        const ref = this.handleEvent(eventName, (payload) => {
          if (handler && typeof this.el[handler] === "function") {
            this.el[handler](payload);
          } else {
            // Dispatch as custom event on the element
            this.el.dispatchEvent(
              new CustomEvent(eventName, {
                detail: payload,
                bubbles: true,
                composed: true,
              })
            );
          }
        });
        this._receiveListeners.push(ref);
      }

      // Handle duskmoon-receive="{phxEvent};{callbackName}"
      if (attr.name === "duskmoon-receive") {
        const [phxEvent, callbackName] = attr.value.split(";");
        const ref = this.handleEvent(phxEvent, (payload) => {
          if (typeof this.el[callbackName] === "function") {
            this.el[callbackName](payload);
          }
        });
        this._receiveListeners.push(ref);
      }
    }
  },

  /**
   * Setup automatic forwarding for dm-* events to phx-* handlers
   *
   * This enables the common pattern of:
   * <el-dm-button phx-hook="WebComponentHook" phx-click="handle_click">
   *
   * When el-dm-button emits 'dm-click', it automatically calls the phx-click handler
   */
  _setupAutomaticForwarding() {
    this._automaticListeners = DM_EVENTS.map((event) => {
      const listener = ({ detail }) => {
        const handler = this.el.getAttribute("phx-" + event.slice(3));
        if (!handler || this.el.hasAttribute("duskmoon-send-" + event)) return;
        const payload = {
          ...detail,
          value: this.el.value,
          name: this.el.name,
          checked: this.el.checked,
        };
        const target = this.el.getAttribute("phx-target");
        if (target) this.pushEventTo(target, handler, payload);
        else this.pushEvent(handler, payload);
      };
      this.el.addEventListener(event, listener);
      return [event, listener];
    });
  },
};

/**
 * FormElementHook - Specialized hook for form custom elements
 *
 * Extends WebComponentHook with form-specific behavior:
 * - Integrates with Phoenix.HTML.Form
 * - Handles phx-feedback-for error display
 * - Manages form field state
 */
export const FormElementHook = {
  ...WebComponentHook,

  mounted() {
    // Call parent mounted
    WebComponentHook.mounted.call(this);

    // Setup form integration
    this._setupFormIntegration();
  },

  _setupFormIntegration() {
    const name = this.el.getAttribute("name");
    const feedbackFor = this.el.getAttribute("phx-feedback-for") || name;

    if (feedbackFor) {
      // Watch for phx-no-feedback class changes to show/hide errors
      this._setupFeedbackObserver(feedbackFor);
    }
  },

  destroyed() {
    WebComponentHook.destroyed.call(this);
    if (this._feedbackObserver) {
      this._feedbackObserver.disconnect();
      this._feedbackObserver = null;
    }
  },

  _setupFeedbackObserver(feedbackFor) {
    // Find the form wrapper that Phoenix LiveView manages
    const form = this.el.closest("form");
    if (!form) return;

    // Observe class changes on form for feedback state
    this._feedbackObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const hasNoFeedback = form.classList.contains("phx-no-feedback");
          // Dispatch event to custom element to show/hide errors
          this.el.dispatchEvent(
            new CustomEvent("dm-feedback-change", {
              detail: { showFeedback: !hasNoFeedback, field: feedbackFor },
            })
          );
        }
      });
    });

    this._feedbackObserver.observe(form, { attributes: true, attributeFilter: ["class"] });
  },
};
