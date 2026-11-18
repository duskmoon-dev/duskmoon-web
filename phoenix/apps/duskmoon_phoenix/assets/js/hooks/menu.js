const controllers = new WeakMap();

export function initMenu(menu) {
  if (controllers.has(menu)) return controllers.get(menu);

  const signal = new AbortController();
  const options = { signal: signal.signal };
  let trigger;
  let requestedOpen;
  let wasOpen = false;

  function anchor() {
    return menu.dataset.anchor
      ? menu.ownerDocument.querySelector(menu.dataset.anchor)
      : null;
  }

  function items() {
    return [...menu.querySelectorAll('[role="menuitem"]:not(:disabled)')]
      .filter((item) => item.closest("[data-dm-menu]") === menu && item.getAttribute("aria-disabled") !== "true");
  }

  menu.addEventListener("beforetoggle", (event) => {
    if (event.newState === "open") trigger = event.source || anchor() || menu.ownerDocument.activeElement;
  }, options);

  menu.addEventListener("toggle", (event) => {
    const open = event.newState === "open";
    trigger?.setAttribute("aria-expanded", String(open));
    if (wasOpen === open) return;

    wasOpen = open;
    if (open && trigger?.isConnected) items()[0]?.focus();
    menu.dispatchEvent(new CustomEvent(open ? "open" : "close", { bubbles: true }));
  }, options);

  menu.addEventListener("click", (event) => {
    const item = event.target.closest('[role="menuitem"]');
    if (!items().includes(item)) return;

    menu.dispatchEvent(new CustomEvent("select", {
      detail: { value: item.value || item.textContent.trim() },
      bubbles: true,
      composed: true,
    }));
    menu.hidePopover();
    if (trigger?.isConnected) trigger.focus();
  }, options);

  function onKeydown(event) {
    const enabled = items();
    const index = enabled.indexOf(menu.ownerDocument.activeElement);
    const last = enabled.length - 1;
    switch (event.key) {
      case "ArrowDown":
        enabled[(index + 1) % enabled.length]?.focus();
        break;
      case "ArrowUp":
        enabled[index > 0 ? index - 1 : last]?.focus();
        break;
      case "Home":
        enabled[0]?.focus();
        break;
      case "End":
        enabled[last]?.focus();
        break;
      case "Escape":
        menu.hidePopover();
        if (trigger?.isConnected) trigger.focus();
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  menu.addEventListener("keydown", onKeydown, options);
  menu.addEventListener("focusout", (event) => {
    if (event.relatedTarget && !menu.contains(event.relatedTarget) &&
        event.relatedTarget !== trigger && menu.matches(":popover-open")) {
      menu.hidePopover();
    }
  }, options);

  function update() {
    const nextOpen = menu.dataset.open;
    if (typeof menu.showPopover !== "function" || requestedOpen === nextOpen) return;
    requestedOpen = nextOpen;
    const source = anchor();
    if (nextOpen === "true" && !menu.matches(":popover-open")) {
      source ? menu.showPopover({ source }) : menu.showPopover();
    } else if (nextOpen === "false" && menu.matches(":popover-open")) {
      menu.hidePopover();
    }
  }

  const controller = {
    update,
    destroy() {
      signal.abort();
      controllers.delete(menu);
    },
  };
  controllers.set(menu, controller);
  update();
  return controller;
}

export const DuskmoonMenu = {
  mounted() { this.menuController = initMenu(this.el); },
  updated() { this.menuController.update(); },
  destroyed() { this.menuController.destroy(); },
};
