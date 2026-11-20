---
name: duskmoon-elements
description: Use the Duskmoon Elements custom elements in a browser app, including leaf or aggregate registration, reactive properties, events, slots, CSS parts, and themes.
---

# Duskmoon Elements

Choose a leaf package for the components a route uses. Use the aggregate when the app benefits from shared registrations. Match all Duskmoon packages to the same published Web version.

```js
import "@duskmoon-dev/el-button/register";
```

The equivalent explicit registration uses `register()` from the leaf's root. To register the common aggregate in an app, use `registerAll()` from `@duskmoon-dev/elements` or import `@duskmoon-dev/elements/register`. From an app already using the aggregate, a leaf entry can be selected as `@duskmoon-dev/elements/el-button/register`. The Code Engine adapter registers separately through `@duskmoon-dev/el-code-engine/register`.

```html
<el-dm-button variant="primary" size="md">Save</el-dm-button>
```

## Integrate with the browser app

- Look up the [registered tags and classes](references/element-catalog.md) and the leaf's documented events, slots, and `part` names. The `variant`, `size`, and event contracts belong to each element.
- Use attributes for supported scalar and boolean values. Set JavaScript properties for data with `attribute: false`, such as table rows and columns. Await `customElements.whenDefined(tag)` before interacting with lazily registered elements.
- Bind events directly when crossing a framework boundary. Use the dispatched name and `event.detail` from the element's contract. For example, tabs emit `change` with `value` and `oldValue`, and input uses `dm-input` and `dm-change`.
- Use `slot` on light-DOM children and `::part()` with documented parts for styling. Keep interactive controls and accessible labels in their expected slots.

```js
import "@duskmoon-dev/el-table/register";

const table = document.querySelector("el-dm-table");
table.columns = [{ key: "name", label: "Name", sortable: true }];
table.data = [{ name: "Alice" }, { name: "Bob" }];
table.addEventListener("sort", (event) => console.log(event.detail));
```

For a shared page theme, import the matching Core theme and set `data-theme`. The Base theme helper can also apply a preset directly to a host.

```js
import { applyTheme } from "@duskmoon-dev/el-base";

applyTheme(document.documentElement, "moonlight");
```

Read the [Base API](references/core-api.md) for reactive properties, helpers, and theme presets. Use `duskmoon-art-elements` for `el-dm-art-*`.
