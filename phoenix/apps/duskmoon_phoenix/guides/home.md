# Phoenix Duskmoon UI

Duskmoon UI component library for Phoenix LiveView applications.

Phoenix Duskmoon UI provides 60+ ready-to-use LiveView components that render as
native HTML or HTML Custom Elements, powered by the `@duskmoon-dev/core` design system and
`@duskmoon-dev/elements` web component packages.

## Architecture

The Hex package supplies native HEEx components and inline icons. The npm
package provides Core-based CSS, native hooks, and optional integration entry
points. React Form and Chat manage their client UI through explicit LiveView
bridges. Retained Elements integrations register their leaf packages by route.

## Quick install

Add `{:duskmoon_phoenix, "~> 11.0"}` to Mix dependencies and
`duskmoon_phoenix@11.0.0` to JavaScript dependencies. Use
`DuskmoonPhoenix.Component` and import `duskmoon_phoenix/css`.

## Component Categories

| Category | Examples | Count |
|----------|----------|-------|
| [Action](`DuskmoonPhoenix.Component.Action.Button`) | Button, Dropdown, Link, Menu, Toggle | 5 |
| [Data Display](`DuskmoonPhoenix.Component.DataDisplay.Card`) | Card, Table, Badge, Avatar, Datetime, Markdown Body, Pagination, Timeline | 19 |
| [Data Entry](`DuskmoonPhoenix.Component.DataEntry.Input`) | Input, Select, Checkbox, Switch, Autocomplete, TreeSelect | 19 |
| [Feedback](`DuskmoonPhoenix.Component.Feedback.Dialog`) | Dialog, Loading, Snackbar, Toast | 4 |
| [Navigation](`DuskmoonPhoenix.Component.Navigation.Appbar`) | Appbar, Breadcrumb, Tab, Stepper, PageHeader | 12 |
| [Layout](`DuskmoonPhoenix.Component.Layout.Divider`) | Divider, Drawer, BottomSheet, ThemeSwitcher | 4 |
| [Icon](`DuskmoonPhoenix.Component.Icon.Icons`) | Material Design Icons, Bootstrap Icons | 1 |
| [CSS Art](`DuskmoonPhoenix.ArtComponent.Snow`) | Snow, Eclipse, PlasmaBall, Signature, SpotlightSearch | 6 |

## Guides

- [Migration to Web 11](migrating-to-v11.md)

- [Getting Started](getting-started.md) — Installation, view helpers, CSS and JS setup
- [Migrating to v9](migrating-to-v9.md) — Upgrade guide from v6/v7/v8 (DaisyUI to @duskmoon-dev/core)
- [Theming](theming.md) — Sunshine/moonlight themes, CSS custom properties, custom colors
- [Hooks](hooks.md) — JavaScript hooks reference for LiveView integration

## Links

- [Hex Package](https://hex.pm/packages/duskmoon_phoenix)
- [npm Package](https://www.npmjs.com/package/duskmoon_phoenix)
- [GitHub](https://github.com/duskmoon-dev/duskmoon-web)
- [Live Storybook](https://duskmoon-storybook.fly.dev)
