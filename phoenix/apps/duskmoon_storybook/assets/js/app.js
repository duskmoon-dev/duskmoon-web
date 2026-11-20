import "phoenix_html";
import { LiveSocket } from "phoenix_live_view";
import { Socket } from "phoenix";
import * as NativeHooks from "duskmoon_phoenix/hooks";
import { FormElementHook, WebComponentHook } from "duskmoon_phoenix/elements";
import { lazyHook } from "duskmoon_phoenix/lazy-hook";
import { DuskmoonLeftMenuHostDemo } from "./left_menu.js";
import { DuskmoonHologramFrame } from "./hologram_frame.js";

function loadReactFeature(name) {
  const entry = new URL("../react/js/react_features.js", import.meta.url);
  return import(entry.href).then((features) => features[name]());
}

const { initMenu, initTabs, ...nativeHooks } = NativeHooks;
const hooks = {
  ...nativeHooks,
  WebComponentHook,
  FormElementHook,
  DuskmoonReactForm: lazyHook(
    () => loadReactFeature("loadForm"),
    { events: ["dm:form:reset"] },
  ),
  DuskmoonReactChat: lazyHook(
    () => loadReactFeature("loadChat"),
    { synchronize: true },
  ),
  DuskmoonComposedChat: lazyHook(
    () => loadReactFeature("loadComposedChat"),
    { synchronize: true },
  ),
  DuskmoonLeftMenuHostDemo,
  DuskmoonHologramFrame,
};

// PhoenixStorybook owns its LiveSocket. The regular component demos need one too.
window.storybook = { Hooks: hooks };

if (!window.location.pathname.startsWith("/storybook") && !window.liveSocket) {
  const csrfToken = document.querySelector("meta[name='csrf-token']")?.getAttribute("content");
  const liveSocket = new LiveSocket("/live", Socket, {
    hooks,
    params: { _csrf_token: csrfToken },
  });

  liveSocket.connect();
  window.liveSocket = liveSocket;
}

const registerChatElements = () => import("@duskmoon-dev/el-chat/register");
const registerCodeEngine = () => import("@duskmoon-dev/el-code-engine/register");

const duskmoonElementRegistrars = {
  "el-dm-accordion": () => import("@duskmoon-dev/el-accordion/register"),
  "el-dm-art-atom": () => import("@duskmoon-dev/el-art-atom/register"),
  "el-dm-art-cat-stargazer": () => import("@duskmoon-dev/el-art-cat-stargazer/register"),
  "el-dm-art-circular-gallery": () => import("@duskmoon-dev/el-art-circular-gallery/register"),
  "el-dm-art-color-spin": () => import("@duskmoon-dev/el-art-color-spin/register"),
  "el-dm-art-eclipse": () => import("@duskmoon-dev/el-art-eclipse/register"),
  "el-dm-art-flower-animation": () => import("@duskmoon-dev/el-art-flower-animation/register"),
  "el-dm-art-gemini-input": () => import("@duskmoon-dev/el-art-gemini-input/register"),
  "el-dm-art-moon": () => import("@duskmoon-dev/el-art-moon/register"),
  "el-dm-art-mountain": () => import("@duskmoon-dev/el-art-mountain/register"),
  "el-dm-art-plasma-ball": () => import("@duskmoon-dev/el-art-plasma-ball/register"),
  "el-dm-art-snow": () => import("@duskmoon-dev/el-art-snow/register"),
  "el-dm-art-sun": () => import("@duskmoon-dev/el-art-sun/register"),
  "el-dm-art-synthwave-starfield": () => import("@duskmoon-dev/el-art-synthwave-starfield/register"),
  "el-dm-alert": () => import("@duskmoon-dev/el-alert/register"),
  "el-dm-autocomplete": () => import("@duskmoon-dev/el-autocomplete/register"),
  "el-dm-bottom-navigation": () => import("@duskmoon-dev/el-bottom-navigation/register"),
  "el-dm-bottom-sheet": () => import("@duskmoon-dev/el-bottom-sheet/register"),
  "el-dm-cascader": () => import("@duskmoon-dev/el-cascader/register"),
  "el-dm-chat": registerChatElements,
  "el-dm-chat-bubble": registerChatElements,
  "el-dm-chat-input": registerChatElements,
  "el-dm-chat-reasoning": registerChatElements,
  "el-dm-chat-scroll": registerChatElements,
  "el-dm-chat-tool": registerChatElements,
  "el-dm-chat-typing": registerChatElements,
  "el-dm-chip": () => import("@duskmoon-dev/el-chip/register"),
  "el-dm-code-engine": registerCodeEngine,
  "el-dm-datetime": () => import("@duskmoon-dev/el-datetime/register"),
  "el-dm-drawer": () => import("@duskmoon-dev/el-drawer/register"),
  "el-dm-file-upload": () => import("@duskmoon-dev/el-file-upload/register"),
  "el-dm-markdown": () => import("@duskmoon-dev/el-markdown/register"),
  "el-dm-markdown-input": () => import("@duskmoon-dev/el-markdown-input/register"),
};

const duskmoonElementSelector = Object.keys(duskmoonElementRegistrars).join(",");
const registrations = new Map();

function importRegistrar(registrar) {
  // Development's generated vendor imports may need a fresh URL after a failed
  // download. Production uses the bundler's ordinary literal chunk links.
  const url = registrar.toString().match(/import\((["'])(\/@vendor\/[^"']+)\1\)/)?.[2];
  return url
    ? () => registrar().catch(() => import(`${url}${url.includes("?") ? "&" : "?"}retry=${Date.now()}`))
    : registrar;
}

function collectDuskmoonElementTags(root) {
  const tags = new Set();

  if (root.nodeType === Node.ELEMENT_NODE && duskmoonElementRegistrars[root.localName]) {
    tags.add(root.localName);
  }

  if (root.querySelectorAll) {
    root.querySelectorAll(duskmoonElementSelector).forEach((element) => {
      tags.add(element.localName);
    });
  }

  return tags;
}

function registerDuskmoonElements(root = document) {
  for (const tag of collectDuskmoonElementTags(root)) {
    if (customElements.get(tag)) continue;
    const registrar = duskmoonElementRegistrars[tag];
    if (registrations.has(registrar)) continue;

    const registration = Promise.resolve().then(() => importRegistrar(registrar))
      .catch((error) => console.error("[Duskmoon] Failed to register " + tag, error))
      .finally(() => registrations.delete(registrar));
    registrations.set(registrar, registration);
  }
}

function initStandaloneControls() {
  for (const [selector, init] of [["[data-dm-menu]", initMenu], ["[data-dm-tabs]", initTabs]]) {
    for (const element of document.querySelectorAll(selector)) {
      if (!element.closest("[data-phx-session]")) init(element);
    }
  }
}

function startDuskmoonElementRegistration() {
  registerDuskmoonElements();
  initStandaloneControls();

  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => registerDuskmoonElements(node));
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startDuskmoonElementRegistration);
} else {
  startDuskmoonElementRegistration();
}

// Theme switcher (standalone — no LiveView required)
// Mirrors the ThemeSwitcher hook logic for controller-rendered pages.
(function initThemeSwitcher() {
  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function resolveAutoTheme() {
    return darkQuery.matches ? "moonlight" : "sunshine";
  }

  function applyTheme(theme) {
    var resolved = (!theme || theme === "default") ? resolveAutoTheme() : theme;
    document.documentElement.setAttribute("data-theme", resolved);
  }

  function setup() {
    var saved = localStorage.getItem("theme") || "default";
    applyTheme(saved);

    // Re-apply when OS color scheme changes (only matters in auto mode)
    darkQuery.addEventListener("change", function() {
      var current = localStorage.getItem("theme") || "default";
      if (current === "default") applyTheme("default");
    });

    var radios = document.querySelectorAll(".theme-controller-item");
    radios.forEach(function(radio) {
      radio.checked = radio.value === saved;
      radio.addEventListener("change", function(e) {
        var theme = e.target.value;
        localStorage.setItem("theme", theme);
        applyTheme(theme);
        // Close the <details> dropdown
        var details = e.target.closest("details");
        if (details) details.removeAttribute("open");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup);
  } else {
    setup();
  }
})();

// Clipboard functionality
function fallbackCopyTextToClipboard(text) {
  var textArea = document.createElement("textarea");
  textArea.value = text;
  
  // Avoid scrolling to bottom
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    // fallback execCommand is deprecated but acceptable for old browsers
  } catch (err) {
    console.error('Fallback: Oops, unable to copy', err);
  }

  document.body.removeChild(textArea);
}

window.copyTextToClipboard = function(text) {
  if (!navigator.clipboard) {
    fallbackCopyTextToClipboard(text);
    return;
  }
  navigator.clipboard.writeText(text).then(function() {
    console.log('Async: Copying to clipboard was successful!');
  }, function(err) {
    console.error('Async: Could not copy text: ', err);
  });
};

window.showCopyFeedback = function(element) {
  const originalContent = element.innerHTML;
  element.innerHTML = '<span class="text-success">✓</span>';
  setTimeout(() => {
    element.innerHTML = originalContent;
  }, 1000);
};
