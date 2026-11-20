---
name: duskmoon-art-elements
description: Embed Duskmoon CSS Art as custom elements, choose leaf or aggregate registration, and configure element attributes, sizes, and accessible content.
---

# Duskmoon Art Elements

Install the art leaf at the app's published Web version and import its registration entry in the browser bundle.

```js
import "@duskmoon-dev/el-art-atom/register";
import "@duskmoon-dev/el-art-moon/register";
```

```html
<el-dm-art-atom size="lg" aria-hidden="true"></el-dm-art-atom>
<el-dm-art-moon variant="crescent" glow aria-hidden="true"></el-dm-art-moon>
```

The leaf also exports an explicit `register()` function. For an app using the aggregate, `registerAllArts()` from `@duskmoon-dev/art-elements` registers every art leaf. Use the [art element catalog](references/css-art-catalog.md) for package names, tags, and supported attributes.

The element owns its Shadow DOM and bundles the corresponding CSS Art stylesheet. Apply documented size, variant, and per-art attributes to the host. Preserve the accessible behavior of interactive art such as Gemini Input and Circular Gallery. Hide only purely decorative hosts from assistive technology.

For plain HTML rendering use `duskmoon-dev-css-art`. For React use `duskmoon-art-components`.
