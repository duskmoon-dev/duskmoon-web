# Migrate to Duskmoon Phoenix 11

Upgrade the Hex and npm distributions together. Release artifacts carry the
same Web version as Core, CSS Art, Elements, and React. The independently
published Duskmoon Bundler and its Hologram fork have their own versions.

| Previous usage | Duskmoon Web 11 |
| --- | --- |
| Hex dependency `{:phoenix_duskmoon, ...}` | `{:duskmoon_phoenix, "~> 11.0"}` |
| OTP application `:phoenix_duskmoon` | `:duskmoon_phoenix` |
| `PhoenixDuskmoon.*` modules and view helpers | `DuskmoonPhoenix.*` |
| `config :phoenix_duskmoon, ...` | `config :duskmoon_phoenix, ...` |
| `Application.*(:phoenix_duskmoon, ...)` and `otp_app: :phoenix_duskmoon` | Use `:duskmoon_phoenix` |
| `Plug.Static` app source, `Application.app_dir/2`, and `:code.priv_dir/1` | Look up assets in `:duskmoon_phoenix` |
| `priv/static/assets/js/phoenix_duskmoon.js` | `priv/static/assets/js/duskmoon_phoenix.js` |
| Bundler profile `:phoenix_duskmoon` | `:duskmoon_phoenix` |
| `phoenix_duskmoon` / `phoenix_duskmoon/hooks` | `duskmoon_phoenix` / `duskmoon_phoenix/hooks` |
| `WebComponentHook` and `FormElementHook` from `phoenix_duskmoon/hooks` | Named exports from `duskmoon_phoenix/elements` |
| `phoenix_duskmoon/css` or `phoenix_duskmoon/components` | `duskmoon_phoenix/css` or `duskmoon_phoenix/components`, Core and native styles |
| Styles for React, Elements theme inheritance, or CSS Art | Import `duskmoon_phoenix/react.css`, `duskmoon_phoenix/elements.css`, or `duskmoon_phoenix/art.css` on the route that uses it |
| `phoenix_duskmoon/react-form`, `phoenix_duskmoon/react-chat` | `duskmoon_phoenix/react-form`, `duskmoon_phoenix/react-chat` |
| `phoenix_duskmoon/svg/mdi/*.svg`, `phoenix_duskmoon/svg/bsi/*.svg` | `duskmoon_phoenix/svg/mdi/*.svg`, `duskmoon_phoenix/svg/bsi/*.svg` |

The old registry names keep their already published releases. Replace
dependency declarations, lockfile entries, and import names in the consuming
application. Keep package-specific configuration under the new OTP application.
There is no definition under the old namespace.

## Native buttons, menus, and tabs

- `dm_btn` renders a native button for ordinary actions. The default type is
  `button`. `type="submit"` and the retained `native_submit` shortcut support
  native validation and submitter identity. `id`, `type`, `form`, `name`,
  `value`, labels, prefix/suffix slots, and LiveView attributes reach the
  native control. Native `phx-click` emits one event. Use `phx-value-name` or
  `phx-value-checked` if an app previously expected values synthesized by
  `WebComponentHook`. Native events can still carry the ordinary button value.
  CSS selectors must match `button` or `.btn` instead of `el-dm-button`. The
  confirmation modal keeps `id-confirm` as the submitted action.
- `dm_menu` uses a stable `id` with a native trigger's `popovertarget`.
  Use `showPopover({ source: trigger })`, `hidePopover()`, and
  `togglePopover({ source: trigger })` to replace the old Elements methods.
  The `DuskmoonMenu` hook preserves open/close events, one
  `select` event with `detail.value`, keyboard movement, and focus
  restoration on Escape and selection. A menu item with `phx-click` uses
  the ordinary LiveView binding. If the consumer separately forwards the
  DOM `select` event, route one of those bindings to its business handler.
- `dm_tab` uses a native tablist, tabs and panels. Set a stable `id` for
  `DuskmoonTabs` in LiveView. Local tab groups render all panels and hide
  inactive ones. If any tab sets `phx_click`, Phoenix owns active content
  and inactive panel shells stay empty. Arrow/Home/End navigate in both
  modes. Local navigation selects the focused panel immediately. In a
  controlled group, Enter/Space send the configured native click event
  once and Phoenix updates the selected panel. Name-matched panels can be
  ordered independently and preserve explicit IDs. Use
  `data-tab-name`, `data-tab-index`, and ARIA attributes for selectors.
- `dm_input`, `dm_checkbox`, `dm_select`, and ordinary forms retain native
  HTML and Phoenix form-field integration. `dm_modal` retains native dialog
  ownership. `dm_dropdown` retains native popover behavior and its small
  expanded-state hook.

In a Phoenix-rendered static document without LiveView, callers can initialize
a menu or tab list with `initMenu(element)` and `initTabs(element)` from
`duskmoon_phoenix/hooks` and call the returned `destroy()` when they remove it.

## React and retained Elements

Install `@duskmoon-dev/components` at the Web version plus compatible
`react` and `react-dom` peers. Register only the React bridge hook used by
your route, optionally via `duskmoon_phoenix/lazy-hook`. The native dialog
can own visibility, Escape, focus and backdrop while a React Form owns its
ignored content region. Apply an explicit cancellation policy when the
application removes that region and use application-owned uploads for files.

Use [the component audit](https://github.com/duskmoon-dev/duskmoon-web/blob/main/phoenix/docs/component-audit.md) to identify
wrappers rendering Elements. Register the corresponding leaf package
on demand. For example, a markdown editor route can import
`@duskmoon-dev/el-markdown-input/register` and explicitly load the Elements
hooks and theme bridge when the route uses them. The default entry
loads neither React nor Elements.
