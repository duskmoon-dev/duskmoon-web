# Phoenix browser integrations

Use `duskmoon_phoenix/hooks` with LiveSocket for native components. It installs the
delegated confirmation behavior and exports the native hooks. The shorter
`import "duskmoon_phoenix"` entry installs confirmation behavior in HTML that
uses no LiveView hooks. Both paths work with `duskmoon_phoenix/css` or with a
consumer's Tailwind build using Core CSS.

| Feature | Imports |
| --- | --- |
| Native HEEx | `duskmoon_phoenix/hooks`, `duskmoon_phoenix/css` |
| Classic or schema-driven React JSON form | `duskmoon_phoenix/react-form`, `duskmoon_phoenix/react.css` |
| React chat and custom composer | `duskmoon_phoenix/react-chat`, optionally `@duskmoon-dev/components/chat/rich`, `duskmoon_phoenix/react.css` |
| Selected Custom Elements | Matching `@duskmoon-dev/el-*/register` and, when forwarding events, `duskmoon_phoenix/elements`; `duskmoon_phoenix/elements.css` for theme variables where needed |
| CSS Art | `duskmoon_phoenix/art.css` or direct imports from `@duskmoon-dev/css-art` |

Import `WebComponentHook` and `FormElementHook` from `duskmoon_phoenix/elements`.
The root and native hooks entries no longer provide either hook or the
`window.__WebComponentHook__` and `window.__FormElementHook__` globals. Register
independent leaves explicitly. For example, `@duskmoon-dev/el-chat/register`
defines the Elements chat family and retains its original chat-composer events.
The markdown editor and code editor use their leaf packages for editing and
preview, file upload retains its drop zone and upload state, and the art leaves
retain animated CSS surfaces. Storybook loads leaves only when their markup
occurs. The native button, menu and tabs use no Element registration.

## Route-demand React hooks

Register an import at the hook boundary if a single LiveSocket hosts both
native and enhanced routes. The literal imports allow a splitting-capable
bundler to keep feature code in separate chunks.

```js
import * as NativeHooks from "duskmoon_phoenix/hooks";
import { lazyHook } from "duskmoon_phoenix/lazy-hook";

const hooks = {
  ...NativeHooks,
  DuskmoonReactForm: lazyHook(
    () => import("duskmoon_phoenix/react-form").then((module) => module.DuskmoonReactForm),
    { events: ["dm:form:reset"] },
  ),
  DuskmoonReactChat: lazyHook(
    () => import("duskmoon_phoenix/react-chat").then((module) => module.DuskmoonReactChat),
    { synchronize: true },
  ),
};
```

The feature chunk is requested on the first matching mount. Simultaneous
mounts share the import. While loading, surrounding HEEx remains visible and the
classic form waits for its JSON transport. A failed import exposes a retry
button. Retrying loads the feature and leaves business actions under the user's
control. A resolved module attaches only to the still-connected owning node.
Explicit form resets arriving while the chunk loads replay in order. Chat uses
the existing read-only sync action after a delayed mount so it can recover
events that arrived before its listener. A page-specific bundle can import the
actual hook directly instead.

## Structured form contract

- The React renderer owns classic field editing and schema form editing.
  Classic forms also collect typed native controls through the existing
  array/path conventions. Use stable wrapper IDs and independent IDs across
  multiple instances. A scoped editor can set `context_key`; changing it
  replaces the editing subtree and starts from the new initialization data.
- Supply initial values with `values`. Omit it in schema mode to use the schema
  defaults. JSON objects, arrays, explicit null, zero, false and empty strings
  retain their types. Omit a property to represent absence. Objects representing
  files, non-finite numbers, sparse arrays and other unsupported values fail
  before transport. Upload bytes through the application and pass the reference
  in the draft. Existing mixed forms default to `novalidate`; opt into browser
  validity with `novalidate={false}`.
- `phx-change` still sends `{id, values, revision, changed}`, with the changed
  path in an array. A form can set `phx-debounce`; local changes render
  immediately. `phx-submit` sends the complete draft with no `changed` property.
  Both provide `request_id`, and scoped forms provide `context_key`. A native
  submitter contributes its `id`, `name` and `value` when present.
- Process validation without persisting. Answer from LiveView with
  `{:reply, %{status: "error", errors: errors}, socket}` or
  `{:reply, %{status: "ok"}, socket}`. The server can echo the request ID,
  revision, and scope to correlate replies. Nested errors and existing dotted
  field keys reach classic controls. Schema controls accept JSON Pointer paths
  as well. Business persistence stays on the server, and a save reply can
  include `message` for the accessible status.
- Use `push_event(socket, "dm:form:reset", %{id: id, values: values})` for an
  explicit authoritative replacement. Include `context_key` for scoped forms.
  Omit `values` to restore mount defaults. Supply the current `revision` if a
  delayed reset must apply only to the draft it followed.
- Rejecting a submission preserves the draft. The client sends one save while
  its acknowledgement is pending. Disconnect or timeout reports an uncertain
  outcome and retains edits, with no automatic save retry. An application with
  durable writes should reconcile the request on the server before a user
  retries. Reconnect restores controls without remounting roots or resetting
  draft state. Stale replies cannot replace errors for newer edits or another
  scope. An application that navigates away owns any persistence of the draft
  across complete destruction of the editor.

React owns the controls in the schema mount. The classic form's subtree is
ignored because it contains native draft controls alongside React-owned field
roots. The outer hook wrapper and schema form's optional HEEx slot remain
LiveView-owned. A native `dm_modal` can host either form. The dialog and browser
own visibility, focus, Escape, backdrop and focus restoration; React owns the
form controls. The Storybook modal keeps the same form node on close to retain
the draft. A consumer can implement explicit cancellation by sending a scoped
reset.

## Streaming chat

Server messages still follow `chat.message`, ordered `chat.delta`,
`chat.tool`, `chat.complete`, `chat.error` and snapshot/recovery events. The hook
applies deltas in arrival order and renders at most once per animation frame.
Sequence gaps still request read-only synchronization. The existing structured
composer protocol preserves request IDs, scope, instance generation, composer
revisions, queue reconciliation and admission acknowledgements. Only read-only
recovery is retried. Custom adapters own upload transport and persistent
draft/recovery policy. See the [React Chat guide](../phoenix/apps/duskmoon_phoenix/guides/react-chat.md).

Run the bridge tests with `bun test --cwd phoenix/apps/duskmoon_phoenix test/js`
after installing the Web workspace and building Core/React packages. The
high-frequency test delivers 600 deltas plus a duplicate and completion within
one frame and asserts the complete string, final sequence, one React render
and zero outbound synchronization requests for the contiguous stream.

See [production asset measurements](performance.md) for the Storybook request and interaction evidence.
