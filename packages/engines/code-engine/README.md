# @duskmoon-dev/code-engine

[![Web CI](https://github.com/duskmoon-dev/duskmoon-web/actions/workflows/ci.yml/badge.svg)](https://github.com/duskmoon-dev/duskmoon-web/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@duskmoon-dev/code-engine)](https://www.npmjs.com/package/@duskmoon-dev/code-engine)

A framework-independent TypeScript editor with vendored CodeMirror 6 and Lezer
and zero runtime dependencies. The optional Duskmoon theme reads host CSS
variables. Use [the Custom Element adapter](../../elements/components/code-engine)
for `<el-dm-code-engine>`. The [Yew editor engine](../../../yew/packages/code-engine)
ships separately through crates.io.

## Install

```bash
bun add @duskmoon-dev/code-engine
```

The package ships ESM and TypeScript declarations and can be installed on its own.
Web release candidates use the npm `rc` tag after publication.

## Quick Start

```typescript
import { EditorState } from "@duskmoon-dev/code-engine/state";
import { EditorView } from "@duskmoon-dev/code-engine/view";
import { basicSetup } from "@duskmoon-dev/code-engine/setup";
import { javascript } from "@duskmoon-dev/code-engine/lang/javascript";

new EditorView({
  state: EditorState.create({
    doc: 'console.log("Hello!");',
    extensions: [basicSetup, javascript()],
  }),
  parent: document.getElementById("editor")!,
});
```

## Exports

| Path | Description |
|------|-------------|
| Package root | Editor APIs and shared utilities |
| `/state` | EditorState, Transaction, Text, StateField, StateEffect |
| `/view` | EditorView, ViewPlugin, Decoration, keymap, tooltips, panels, gutters |
| `/language` | Language, HighlightStyle, fold, indent, bracket matching |
| `/commands` | Default keymaps, history, undo/redo |
| `/search` | Search & replace |
| `/autocomplete` | Autocomplete, snippets, close brackets |
| `/lint` | Linting framework |
| `/collab` | Collaborative editing |
| `/merge` | Merge view |
| `/lsp` | LSP client integration |
| `/language-data` | Language metadata |
| `/parser/common` | Tree, SyntaxNode, Parser interface |
| `/parser/lr` | LR parser implementation |
| `/parser/highlight` | Syntax highlighting tags |
| `/lang/*` | Language packs including JavaScript, Python, Markdown, Rust, Elixir, Erlang, HEEx, Dart, Zig, and Caddyfile |
| `/lang/legacy/*` | Stream modes: Elixir, Ruby, Erlang, Dart, Swift, Kotlin, Lua, Shell, Dockerfile, TOML, Nginx, Nix, Haskell, and more |
| `/theme/one-dark` | One Dark theme |
| `/theme/duskmoon` | DuskMoonUI theme (CSS custom properties) |
| `/theme/sunshine`, `/theme/moonlight` | Fixed light and dark Duskmoon themes |
| `/keymaps/vim` | Vim keybindings |
| `/keymaps/emacs` | Emacs keybindings |
| `/setup` | `basicSetup` and `minimalSetup` extension arrays |

See [package.json](package.json) for all declared entry points, including the
legacy stream mode wildcard.

## Development

From the Duskmoon Web root, use Bun 1.4.0.

```sh
bun install --frozen-lockfile
bun run --filter @duskmoon-dev/code-engine-playground dev
bun run build:apps @duskmoon-dev/code-engine-playground
bun run test:packages @duskmoon-dev/code-engine
bun run --filter @duskmoon-dev/code-engine typecheck
bun run --filter @duskmoon-dev/code-engine verify
```

The workspace build emits split ESM, legacy modes, declaration files, and
shared chunks. The private playground uses source during development and built
exports in production. Releases are staged and verified by [Duskmoon Web](../../../docs/release.md).

[UPSTREAM.md](UPSTREAM.md) records the vendored revisions. Keep parser sources
and generated files together when updating a grammar. The `sync-upstream.ts`
utility provides import rewriting helpers and prints the manual sync procedure.

## License

[MIT and upstream notices](LICENSE).
