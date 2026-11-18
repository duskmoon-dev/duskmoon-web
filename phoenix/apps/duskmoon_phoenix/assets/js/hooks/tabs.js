const controllers = new WeakMap();

export function initTabs(container) {
  if (controllers.has(container)) return controllers.get(container);

  const controller = new AbortController();
  const options = { signal: controller.signal };
  let serverKey;
  let activeKey;

  const tabs = () => [...container.querySelectorAll(':scope > [role="tablist"] > [role="tab"]')];
  const panels = () => container.querySelectorAll(':scope > [role="tabpanel"]');
  const local = () => container.dataset.controlled !== "true";
  const value = (tab) => tab?.dataset.tabName || tab?.dataset.tabIndex;

  function focusTab(tab) {
    for (const item of tabs()) item.tabIndex = item === tab ? 0 : -1;
    tab?.focus();
  }

  function select(key) {
    activeKey = key;
    for (const tab of tabs()) {
      const selected = tab.dataset.tabKey === key;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
    for (const panel of panels()) {
      const selected = panel.dataset.panelKey === key;
      panel.dataset.active = String(selected);
      panel.hidden = !selected;
    }
  }

  container.addEventListener("click", (event) => {
    if (!local()) return;
    const tab = event.target.closest('[role="tab"]');
    const items = tabs();
    if (!items.includes(tab) || activeKey === tab.dataset.tabKey) return;

    const oldTab = items.find((item) => item.dataset.tabKey === activeKey);
    select(tab.dataset.tabKey);
    container.dispatchEvent(new CustomEvent("change", {
      detail: { value: value(tab), oldValue: value(oldTab) },
      bubbles: true,
    }));
  }, options);

  container.addEventListener("keydown", (event) => {
    const items = tabs();
    const index = items.indexOf(event.target.closest('[role="tab"]'));
    if (index === -1) return;

    const vertical = items[index].parentElement.getAttribute("aria-orientation") === "vertical";
    const previous = vertical ? "ArrowUp" : "ArrowLeft";
    const next = vertical ? "ArrowDown" : "ArrowRight";
    let target;
    switch (event.key) {
      case previous:
        target = items[(index - 1 + items.length) % items.length];
        break;
      case next:
        target = items[(index + 1) % items.length];
        break;
      case "Home":
        target = items[0];
        break;
      case "End":
        target = items.at(-1);
        break;
      default:
        return;
    }

    event.preventDefault();
    focusTab(target);
    if (local()) target.click();
  }, options);

  const result = {
    update() {
      const nextKey = container.dataset.activeKey;
      if (serverKey !== nextKey || !local() || !tabs().some((tab) => tab.dataset.tabKey === activeKey)) {
        activeKey = nextKey;
      }
      serverKey = nextKey;
      if (local()) select(activeKey);
    },
    destroy() {
      controller.abort();
      controllers.delete(container);
    },
  };
  controllers.set(container, result);
  result.update();
  return result;
}

export const DuskmoonTabs = {
  mounted() { this.tabsController = initTabs(this.el); },
  updated() { this.tabsController.update(); },
  destroyed() { this.tabsController.destroy(); },
};
