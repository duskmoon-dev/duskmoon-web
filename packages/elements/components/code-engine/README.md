# @duskmoon-dev/el-code-engine

Custom Element adapter for the Duskmoon TypeScript editor. Install the adapter
and register the element on pages that use it.

```sh
bun add @duskmoon-dev/el-code-engine
```

```js
import '@duskmoon-dev/el-code-engine/register';
```

```html
<el-dm-code-engine
  language="elixir"
  theme="duskmoon"
  value="IO.puts(:hello)"
  show-topbar
></el-dm-code-engine>
```

Use the `value` property to read and update the live document. Edits emit
`input` and a changed document emits `change` on blur. The `readonly`,
`wrap`, `language`, and `theme` settings apply to the open editor. Optional
`topbar` and `bottombar` slots replace the corresponding bars.

The adapter loads language packs on demand. It imports the engine from the exact
coordinated npm version, sharing the engine's public extensions and types with
other consumers. Use the [standalone engine](../../../engines/code-engine)
directly for a framework-independent editor.
