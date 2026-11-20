# Native components and hooks

Use `DuskmoonPhoenix.Component` for the `dm_*` functions in HEEx. Check the component documentation for the supported attributes and slots. The [renderer reference](https://github.com/duskmoon-dev/duskmoon-web/blob/v2.0.0-rc.2/phoenix/docs/component-audit.md) identifies each component's renderer and required assets.

| Need | Entry point | Contract |
| --- | --- | --- |
| Form and fields | `dm_form`, `dm_input`, `dm_checkbox`, `dm_select` | Bind `Phoenix.HTML.FormField` and keep names, labels, error text, and native validation. |
| Form actions | `dm_btn` | Use `type="submit"` for submission and keep `name`, `value`, and external `form` on the native button. Use `phx-value-*` for application-specific LiveView click data. |
| Menu and dropdown | `dm_menu`, `dm_dropdown` | Use stable IDs and the native Popover API. Register `DuskmoonMenu` or `DuskmoonPopover` for the matching hook. Keep one business event per selection. |
| Tabs | `dm_tab` | Register `DuskmoonTabs`. Local tabs switch their panels immediately. When a tab uses `phx_click`, LiveView owns the active panel and Enter or Space activates the focused tab. |
| Dialog | `dm_modal` | Preserve browser-owned visibility, focus restoration and dismissal. Use the library's slots for content and actions. |
| Resizable layout | `dm_split_pane` | Register `DuskmoonSplitPane`. Keep IDs stable across LiveView patches. |
| Theme preference | `dm_theme_switcher` | Register `ThemeSwitcher`. Style the document through `data-theme` and Core tokens. |
| Icons | `dm_mdi`, `dm_bsi` | Render inline SVG from Hex. npm additionally exposes `duskmoon_phoenix/svg/mdi/*.svg` and `duskmoon_phoenix/svg/bsi/*.svg`. |
| Server-rendered Markdown | `dm_markdown_body` | Use the native server renderer for static Markdown. Use the explicit Elements route for the client Markdown wrapper when its features are required. |

```js
import { DuskmoonMenu, DuskmoonTabs } from "duskmoon_phoenix/hooks";

const hooks = { DuskmoonMenu, DuskmoonTabs };
```

Merge these hooks into the app's existing LiveSocket options. In a static document use `initMenu(element)` or `initTabs(element)` from the same entry and call `destroy()` on the returned controller when removing it. Use the root `duskmoon_phoenix` runtime if the app only needs delegated confirmation dialogs in server-rendered markup.
