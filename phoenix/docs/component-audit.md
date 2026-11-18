# Phoenix component renderers in Web 11

The source baseline is Phoenix commit `b115f533c24587c0b6ea8ca1ec3598d9e782863a`.
Unless marked in the migration guide, public `dm_*` functions keep their
slots, attributes and LiveView handlers. At runtime forms, selection, focus
and navigation remain with the renderer that owns those interactions.

## Changed renderers

| Phoenix components | Source renderer | Web renderer and contract | Assets and verification |
| --- | --- | --- | --- |
| `dm_btn` | Default Element, native form/invoker/confirm and navigation paths | Native `button` or link. Keeps confirmation, submitter and form owner, browser validation, disabled/loading, slot content, navigation, accessible name and caller-supplied LiveView binding. Native click avoids reforwarding the same event. | Core buttons and existing confirmation listener. Button ExUnit and the clean native fixture cover form attributes, submitter, validation and events. |
| `dm_menu`, `dm_menu_item` | Elements menu and menu items | Native Popover API plus a small menu controller. Preserves placement, enabled-item keyboard movement, initial open, selection value, labels, and Escape/selection focus restoration. Consume native popover methods and retain one business binding per selection. | Core menu styles, `native-menu.css`, `DuskmoonMenu`. Menu ExUnit and desktop browser probes. |
| `dm_tab` | Elements wrapper with HEEx buttons and active-only content | Native tablist. Local groups keep inactive DOM hidden. Groups with `phx_click` let the server select and render active content. Linked IDs, focus, and keyboard semantics are scoped to the tablist. | Core tabs and `DuskmoonTabs`. Tabs ExUnit and desktop browser probes. |
| `dm_react_form`, `dm_react_field` | React-owned ignored region with LiveView events | React owns the editor. Server owns validation and persistence. Existing request, revision, and reset protocol remains. Native dialog can own the shell. | Explicit React Form entry, optional peers, and React CSS. Bridge protocol and consumer fixtures. |
| `dm_react_chat` | React-owned ignored region and chat events | React owns editing and rendering. Ordered updates are collected between renders. Application owns authoritative snapshots, business events, and durable conversation state. | Explicit React Chat entry, optional peers, and React CSS. Bridge protocol and stream tests. |

## Native and server-rendered paths

The baseline and Web renderers in this table use HEEx and Core CSS, with
native controls, LiveView commands, or the listed small hook. The component
tests referenced by category live in
[`apps/duskmoon_phoenix/test/duskmoon_phoenix/component`](../apps/duskmoon_phoenix/test/duskmoon_phoenix/component/).

| Phoenix components | Retained behavior | Assets and check |
| --- | --- | --- |
| `dm_link` | Navigation, patch and browser links | Core, action component tests |
| `dm_dropdown`, `dm_popover`, `dm_tooltip` | Native disclosure and transient content, expanded state and interest invokers | Core popover, `DuskmoonPopover`, dropdown and popover tests |
| `dm_fab` | Floating speed-dial actions | Core popover, action tests |
| `dm_swap`, `dm_toggle_group` | Checkbox-driven visual swap and toggle interactions | Core swap and toggle classes, action tests |
| `dm_avatar`, `dm_badge`, `dm_list`, `dm_stat`, `dm_timeline`, `dm_table` | Image/placeholder, status treatment, semantic lists, metrics, chronology, rows and slots | Core, data-display tests |
| `dm_card`, `dm_async_card` | Composable card and async loading/error/result content | Core, card tests |
| `dm_carousel`, `dm_diff` | Browser scroll snap, focus and interactive range-based comparison | Core, primitive and browser tests |
| `dm_collapse`, `dm_collapse_group` | Disclosure and grouped collapse state | Core, data-display tests |
| `dm_countdown`, `dm_progress`, `dm_radial_progress` | Server countdown values and determinate/indeterminate progress | Core, data-display and primitive tests |
| `dm_flash`, `dm_flash_group` | Flash labels, dismissal and disconnected status | Core and LiveView client actions, flash tests |
| `dm_markdown_body` | Server-side formatting, GFM, front matter, highlighting and configurable rendering | MDEx and Core markdown styles, Markdown body tests |
| `dm_pagination`, `dm_pagination_thin` | Link- and event-based paging | Core, pagination tests |
| `dm_skeleton*` | Loading placeholders for general, text, card, avatar, table, list, form and comment layouts | Core, skeleton tests |
| `dm_checkbox`, `dm_compact_input`, `dm_input`, `dm_radio`, `dm_select`, `dm_switch`, `dm_textarea` | Phoenix form binding, names and values, labels, errors and native validation | Core, data-entry tests |
| `dm_form`, `dm_label`, `dm_error`, `dm_fieldset`, `dm_form_row`, `dm_form_grid`, `dm_form_section`, `dm_form_divider`, `dm_form_inline`, `dm_form_hint`, `dm_form_counter` | Form submission, label/error association, field layouts and accessible hints | Core, form and primitive tests |
| `dm_filter_group`, `dm_otp_input`, `dm_pin_input`, `dm_rating`, `dm_segment_control`, `dm_slider`, `dm_time_input` | Native checkbox/radio/range/time input semantics and application value slots | Core, data-entry and primitive tests |
| `dm_multi_select`, `dm_tree_select` | Native multi-value selections and popover focus | Core, `DuskmoonPopover`, data-entry tests |
| `dm_modal` | Native dialog, Invoker Commands, Escape, focus restoration and slots, with an optional React-owned content region | Core dialogs, native confirmation runtime and button browser tests |
| `dm_loading_spinner`, `dm_loading_ex`, `dm_snackbar`, `dm_snackbar_container`, `dm_toast`, `dm_toast_container` | Status, live-region notifications and dismissal | Core, feedback tests |
| `dm_mdi`, `dm_bsi` | Inline SVG with original lookups and attribute forwarding | Bundled icon files in Hex, SVG subpath exports in npm, clean consumer assertion |
| `dm_divider`, `dm_sidebar_layout`, `dm_split_pane`, `dm_theme_switcher` | Layout separation, responsive sidebar, keyboard/pointer resizer, theme preference | Core, split-pane CSS, native hooks, hook tests and Storybook |
| `dm_actionbar`, `dm_appbar`, `dm_simple_appbar`, `dm_breadcrumb`, `dm_navbar`, `dm_page_footer`, `dm_stepper` | Semantic navigation regions and slots, active page or step | Core, navigation tests |
| `dm_left_menu`, `dm_left_menu_group`, `dm_megamenu`, `dm_page_header` | Page and group navigation, persistent sidebar, native popover and sticky header | Core and corresponding native hooks, navigation and integration tests |

## Explicit Elements integrations

Each wrapper in this table renders the same custom element as the baseline.
Register its leaf package from a route that actually renders it. Install
`duskmoon_phoenix/elements` hooks where the wrapper relies on LiveView event
forwarding. Import `duskmoon_phoenix/elements.css` for shared theme
inheritance. The basic package and native hook entry do not register any tags.

| Phoenix components | Behavior retained by the Elements implementation | Registration and scoped check |
| --- | --- | --- |
| `dm_accordion` | Shared single/multiple expansion, item slots and keyboard/focus behavior | `@duskmoon-dev/el-accordion/register`, accordion component tests and story |
| `dm_alert` | Dismissible alert with named/custom and default type icons, compact/outlined/filled variants | `@duskmoon-dev/el-alert/register`, alert component tests and form story |
| `dm_autocomplete` | Option filtering, suggestions, keyboard choices and submitted value | `@duskmoon-dev/el-autocomplete/register`, autocomplete tests and story |
| `dm_cascader` | Multi-level choice tracking and selection path, disabled options and search | `@duskmoon-dev/el-cascader/register`, cascader tests and story |
| `dm_file_upload` | Dropzone, acceptance, multiple files and file selection events | `@duskmoon-dev/el-file-upload/register`, file-upload tests and story |
| `dm_code_engine` | CodeMirror editing, highlights, language selection, keyboard shortcuts and edit events | `@duskmoon-dev/el-code-engine/register`, code engine tests and integration |
| `dm_markdown_input` | Rich Markdown editor, command toolbar, edit/preview transitions and field state | `@duskmoon-dev/el-markdown-input/register`, editor bridge tests and story |
| `dm_markdown` | Client-fetched sources and dynamic highlighting/Mermaid options. SSR Markdown is available from `dm_markdown_body`. | `@duskmoon-dev/el-markdown/register`, Markdown tests and story |
| `dm_datetime` | Browser IANA time zone and token formatting, including explicit-offset and wall-clock cases | `@duskmoon-dev/el-datetime/register`, datetime tests and story |
| `dm_chip` | Removable/selected chip state and events in interactive mode, with native static mode | `@duskmoon-dev/el-chip/register`, chip tests and story |
| `dm_chat`, `dm_chat_scroll`, `dm_chat_bubble`, `dm_chat_input`, `dm_chat_reasoning`, `dm_chat_tool`, `dm_chat_typing` | Existing streamed markup, follow-scroll, composable custom composer, tool and reasoning panels | `@duskmoon-dev/el-chat/register`, chat component tests and story |
| `dm_drawer`, `dm_bottom_sheet` | Gesture, placement and controlled transitions with themed backdrops | `@duskmoon-dev/el-drawer/register`, `@duskmoon-dev/el-bottom-sheet/register`, layout tests and stories |
| `dm_bottom_nav` | Selected-value event, disables and mixed native navigation/actions in the Elements renderer | `@duskmoon-dev/el-bottom-navigation/register`, navigation tests and story |
| `dm_art_atom`, `dm_art_cat_stargazer`, `dm_art_circular_gallery`, `dm_art_color_spin`, `dm_art_eclipse`, `dm_art_flower_animation`, `dm_art_gemini_input`, `dm_art_moon`, `dm_art_mountain`, `dm_art_plasma_ball`, `dm_art_snow`, `dm_art_sun`, `dm_art_synthwave_starfield` | Exact Element-owned CSS Art DOM, configuration and animation lifecycle. Interactive Gemini Input, plasma ball and gallery keep their encapsulated interaction. | Matching `@duskmoon-dev/el-art-*/register` leaf, Art Components gallery and Elements tests |

The tests and stories listed here identify checks that exercise a contract.
See the Web verification report for the checks actually executed in this
migration, especially browser and performance results.
