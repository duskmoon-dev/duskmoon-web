# Getting Started

Duskmoon Phoenix uses Phoenix LiveView 1.2 and Tailwind CSS v4. Add the release
of the Hex package that corresponds to the current Web version.

```elixir
{:duskmoon_phoenix, "~> 11.0"}
```

Install the npm counterpart with the same Web version.

```sh
bun add duskmoon_phoenix@11.0.0
```

Import the compiled stylesheet and, when needed, the native hook exports.

```css
@import "duskmoon_phoenix/css";
```

```js
import * as DuskmoonHooks from "duskmoon_phoenix/hooks";

const liveSocket = new LiveSocket("/live", Socket, {
  params: { _csrf_token: csrfToken },
  hooks: DuskmoonHooks,
});
```

Use the component module from your application view helpers.

```elixir
defp html_helpers do
  quote do
    use DuskmoonPhoenix.Component
  end
end
```

Use native HEEx and Core classes for the default path. An application building
Tailwind utilities itself can also install same-version `@duskmoon-dev/core`,
import its plugin and themes, and include its own `lib/**/*.{ex,heex}`
sources and the Hex dependency's component sources in Tailwind scanning.
`duskmoon_phoenix/css` includes generated utilities for the library templates,
and the application's build generates its additional utilities.

For a Duskmoon Bundler profile that builds Tailwind from source, include the
package templates and any optional bridge's JavaScript classes in `sources`.
For example, a React Chat route can use:

```elixir
tailwind: [
  css: "assets/css/app.css",
  sources: [
    %{base: "lib", pattern: "**/*.{ex,heex}"},
    %{base: "deps/duskmoon_phoenix/lib", pattern: "**/*.{ex,heex}"},
    %{base: "deps/duskmoon_phoenix/assets/js/react_chat", pattern: "**/*.js"}
  ]
]
```

```heex
<.dm_form for={@form} phx-change="validate" phx-submit="save">
  <.dm_input field={@form[:title]} label="Title" required />
  <.dm_btn type="submit" name="action" value="save" variant="primary">Save</.dm_btn>
</.dm_form>
```

React Form and Chat load through separate entry points. If you compile the Form
bridge's classes, include `deps/duskmoon_phoenix/assets/js/react_form` in the
same profile. Explicitly register an Elements leaf and its optional bridge only for routes that render a retained
Element. The [migration guide](migrating-to-v11.md) lists these imports and
their matching styles.
