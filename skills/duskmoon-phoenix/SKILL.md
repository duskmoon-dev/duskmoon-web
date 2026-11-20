---
name: duskmoon-phoenix
description: Build or migrate Phoenix LiveView applications using duskmoon_phoenix, including native HEEx components, CSS and hooks, and optional React Form, React Chat, and Elements integrations.
---

# Duskmoon Phoenix

Use `duskmoon_phoenix` for both Hex and npm, `:duskmoon_phoenix` for OTP configuration, and `DuskmoonPhoenix.*` for Elixir modules. Pin the same published Web version on both registries and for any Duskmoon packages the app imports. The [migration guide](https://github.com/duskmoon-dev/duskmoon-web/blob/v2.0.0-rc.2/phoenix/apps/duskmoon_phoenix/guides/migrating-to-duskmoon-web.md) maps the previous package, namespace, hook, asset, and configuration names.

## Native setup

Pin both the Hex dependency in `mix.exs` and its npm counterpart to the chosen Web version.

```elixir
{:duskmoon_phoenix, "2.0.0-rc.2"}
```

```sh
bun add duskmoon_phoenix@2.0.0-rc.2
```

Add `@import "duskmoon_phoenix/css";` to the app's stylesheet. Add `use DuskmoonPhoenix.Component` to the application view helpers. Register native hooks from `duskmoon_phoenix/hooks` in the existing LiveSocket. Include the relevant hook when using native menus, tabs, the theme switcher, or the split pane. Keep stable DOM IDs for hook mounts.

```heex
<.dm_form for={@form} phx-change="validate" phx-submit="save">
  <.dm_input field={@form[:title]} label="Title" required />
  <.dm_btn type="submit" name="action" value="save" variant="primary">Save</.dm_btn>
</.dm_form>
```

Native HEEx and Core CSS are the default. Use native form ownership and submitter attributes, browser popover/dialog state, and one LiveView binding per action. Keep labels, error associations, and keyboard focus connected to the real interactive control.

## Choose feature assets

- Read [components and native hooks](references/components.md) for form, navigation, layout, and icon examples.
- Read [optional integrations](references/integrations.md) for React Form, React Chat, retained Elements, and CSS Art. Add a feature's entry point, CSS, and peers only on routes that use it.
- For a Tailwind v4 source build, use the same-version Core plugin and themes. Include application HEEx and the dependency's sources in the Tailwind scan. See the [package setup guide](https://github.com/duskmoon-dev/duskmoon-web/blob/v2.0.0-rc.2/phoenix/apps/duskmoon_phoenix/guides/getting-started.md) for the Bundler profile and feature-specific paths.
