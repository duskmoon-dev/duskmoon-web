---
name: duskmoon-art-components
description: Render Duskmoon CSS Art in React or Next.js using typed Art components, stylesheet imports, decorative accessibility, and interactive wrapper props.
---

# Duskmoon React Art

Install `@duskmoon-dev/art-components` and `@duskmoon-dev/css-art` at the same published Web version with React and React DOM 19. Load `@duskmoon-dev/art-components/styles.css` once in the app entry or Next.js layout. That entry imports the CSS Art stylesheet.

```tsx
import { ArtAtom, ArtMoon, ArtSun } from "@duskmoon-dev/art-components";

export function HeaderArt() {
  return (
    <div>
      <ArtMoon crescent glow size="lg" />
      <ArtSun rays pulse size="sm" />
      <ArtAtom decorative={false} aria-label="Orbiting atom logo" />
    </div>
  );
}
```

The package also exports `ArtEclipse`, `ArtMountain`, `ArtSnowflake`, `ArtPlasmaBall`, `ArtCircularGallery`, `ArtCatStargazer`, `ArtFlowerAnimation`, `ArtColorSpin`, `ArtSynthwaveStarfield`, `ArtCsswitch` (also `ArtCSSwitch`), `ArtSnowballPreloader`, and `ArtGeminiInput`. Read each wrapper's props for variants and sizing. `ArtCircularGallery` accepts typed items with image source and title. Use meaningful image alternatives.

Decorative wrappers hide art by default. Use `decorative={false}` and an accessible name when the illustration carries meaning. For interactive wrappers, configure the real input or textarea by using the wrapper's supported props.

```tsx
import { ArtPlasmaBall } from "@duskmoon-dev/art-components";

export function PlasmaSwitch() {
  return <ArtPlasmaBall defaultChecked onCheckedChange={console.log} />;
}
```

Use `className`, `style`, and documented art custom properties for app-specific presentation. See the [released React Art documentation](https://github.com/duskmoon-dev/duskmoon-web/tree/v2.0.0-rc.2/packages/react/art-components) for typed examples.
