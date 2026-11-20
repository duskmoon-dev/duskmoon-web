---
name: duskmoon-dev-css-art
description: Render Duskmoon CSS Art with stylesheets and HTML markup, including required children, size modifiers, public custom properties, and native interactive controls.
---

# Duskmoon CSS Art

Install `@duskmoon-dev/css-art` at the app's published Duskmoon Web version. Use the package root for the complete stylesheet or a public leaf export for an individual art piece.

```css
@import "@duskmoon-dev/css-art";
```

```css
@import "@duskmoon-dev/css-art/dist/art/moon.css";
```

Art rules are in `@layer css-art`. Preserve the documented root and child classes. Use the [art catalog and markup recipes](references/art.md) to choose a piece and copy its required DOM structure.

```html
<div class="art-moon art-moon-crescent art-moon-glow" aria-hidden="true"></div>
```

Set public `--art-*` properties on the art root. For purely decorative art, use `aria-hidden="true"`. Preserve image alternatives, accessible control names, and input/link semantics in interactive art. Keep reduced-motion fallbacks and check the supported browser matrix for effects that use newer CSS features.

For React wrappers use `duskmoon-art-components`. For self-contained custom elements use `duskmoon-art-elements`. See [Web docs](https://duskmoon-dev.github.io/duskmoon-web/) for complete examples.
