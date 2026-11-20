---
name: duskmoon-code-engine
description: Install and integrate the published Duskmoon TypeScript editor or its Custom Element adapter, including editor lifecycle, language loading, themes, and TypeScript imports.
---

# Duskmoon Code Engine

Use npm `@duskmoon-dev/code-engine` for a framework-independent TypeScript editor. It ships ESM, declarations, and vendored CodeMirror and Lezer. Choose a published Web version and match it with `@duskmoon-dev/el-code-engine` or `duskmoon_phoenix` when using the adapter. Use `duskmoon-yew` for the separate Rust `code-engine` crate and its Tree-sitter assets.

## Direct editor integration

```ts
import { EditorState } from "@duskmoon-dev/code-engine/state";
import { EditorView } from "@duskmoon-dev/code-engine/view";
import { basicSetup } from "@duskmoon-dev/code-engine/setup";
import { javascript } from "@duskmoon-dev/code-engine/lang/javascript";

export function mountEditor(parent: HTMLElement) {
  const view = new EditorView({
    state: EditorState.create({ doc: "const answer = 42;", extensions: [basicSetup, javascript()] }),
    parent,
  });
  return () => view.destroy();
}
```

Mount in the browser when a real element is available, and destroy the view on teardown. Use the exported `language`, `commands`, `lang/*`, `theme/*`, and `keymaps/*` entries as needed. For reconfiguration, preserve view and extension identity across language or theme changes. The `theme/duskmoon` theme uses host CSS variables.

## Element integration

```js
import "@duskmoon-dev/el-code-engine/register";
```

```html
<el-dm-code-engine language="elixir" theme="duskmoon" show-topbar></el-dm-code-engine>
```

Read and write the element's live `value` property. `input` reports edits and `change` reports a changed value on blur. Use `readonly`, `wrap`, and the optional `topbar` or `bottombar` slots as supported. Use a route-level import to load the adapter. Its language modules load on demand and reuse the same exact-version engine.

Use public subpaths in both Bundler and NodeNext TypeScript projects. When deploying under a subpath, exercise a language switch in the deployed app so lazy chunks resolve from the app's actual base URL. The [released editor documentation](https://github.com/duskmoon-dev/duskmoon-web/tree/v2.0.0-rc.2/packages/engines/code-engine) lists the editor API and available language packs.
