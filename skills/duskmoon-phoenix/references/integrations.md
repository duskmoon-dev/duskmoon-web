# Optional Phoenix integrations

## React Form and Chat

Install matching `@duskmoon-dev/components` with React and React DOM 19. Add `duskmoon_phoenix/react.css` to the route's styles and register the selected hook. Use the app's existing Tailwind source setup to generate utilities from `deps/duskmoon_phoenix/lib` and `deps/duskmoon_phoenix/assets/js/react_form` or `deps/duskmoon_phoenix/assets/js/react_chat` as appropriate. With Duskmoon Bundler, use the same directories in the build profile's `tailwind.sources`.

```js
import { DuskmoonReactForm } from "duskmoon_phoenix/react-form";
import { DuskmoonReactChat } from "duskmoon_phoenix/react-chat";

const hooks = { DuskmoonReactForm, DuskmoonReactChat };
```

- `dm_react_form` supports nested HEEx with `dm_react_field` or a JSON Schema form. React owns its fields and sends typed JSON. LiveView owns validation, persistence, and application access checks. See the [form guide](https://github.com/duskmoon-dev/duskmoon-web/blob/v2.0.0-rc.2/phoenix/apps/duskmoon_phoenix/guides/react-forms.md).
- `dm_react_chat` uses an ignored React mount. Send transcript updates through the bridge events. LiveView owns the authoritative conversation and request admission. For optional scroll resume, register a custom hook built with `createDuskmoonReactChat({ resumeFollowOnScroll: true })` and pass its name in `hook`. See the [chat guide](https://github.com/duskmoon-dev/duskmoon-web/blob/v2.0.0-rc.2/phoenix/apps/duskmoon_phoenix/guides/react-chat.md).

## Retained Elements and CSS Art

Use the [renderer reference](https://github.com/duskmoon-dev/duskmoon-web/blob/v2.0.0-rc.2/phoenix/docs/component-audit.md#explicit-elements-integrations) to select a leaf. For example, `dm_markdown_input` uses `@duskmoon-dev/el-markdown-input/register`, and `dm_code_engine` uses `@duskmoon-dev/el-code-engine/register`. Add the optional Elements theme stylesheet after the native stylesheet.

```js
import "@duskmoon-dev/el-markdown-input/register";
import { FormElementHook, WebComponentHook } from "duskmoon_phoenix/elements";
```

Register the bridges the markup actually uses and load `duskmoon_phoenix/elements.css` for shared theme inheritance. For decorative `dm_art_*` wrappers, use `DuskmoonPhoenix.ArtComponent` and register the matching art leaf. Load `duskmoon_phoenix/art.css` for routes that use its CSS Art styles.
