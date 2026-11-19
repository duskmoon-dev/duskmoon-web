# Duskmoon Phoenix

Duskmoon Phoenix provides HEEx components styled with Duskmoon Core. The Hex
package supplies the components and the npm package supplies styles, LiveView
hooks, and SVG assets. Both distributions share the Duskmoon Web version.

Add the Hex dependency to your application:

```elixir
{:duskmoon_phoenix, "2.0.0-rc.0"}
```

Use `DuskmoonPhoenix.Component` in your view helpers:

```elixir
defp html_helpers do
  quote do
    use DuskmoonPhoenix.Component
  end
end
```

Install the npm distribution at the same version and import its CSS:

```sh
bun add duskmoon_phoenix@2.0.0-rc.0
```

```css
@import "duskmoon_phoenix/css";
```

Import the native hooks where you configure your app's LiveSocket:

```js
import * as DuskmoonHooks from "duskmoon_phoenix/hooks";

// Merge DuskmoonHooks into the hooks option of your LiveSocket.
```

A basic Phoenix app uses Core and browser controls. Import
`duskmoon_phoenix/react-form` or `duskmoon_phoenix/react-chat` on routes that
need React. Use `duskmoon_phoenix/elements` and the relevant Elements package
on routes that use retained custom elements. See
[the migration guide](guides/migrating-to-duskmoon-web.md) for the exact imports and
event contracts.
