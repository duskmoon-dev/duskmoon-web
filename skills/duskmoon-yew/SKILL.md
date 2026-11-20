---
name: duskmoon-yew
description: Use the released yew-duskmoon crate in Yew and Trunk apps, including Rust features, matching Core CSS, native HTML contracts, and editor Worker assets under a deployment subpath.
---

# Duskmoon Yew

Use the `yew-duskmoon` crate with Yew 0.23. Choose a published Web version and match Core CSS in the app. A prerelease dependency can pin `=2.0.0-rc.2`.

```toml
[dependencies]
yew = { version = "0.23", features = ["csr"] }
yew-duskmoon = "=2.0.0-rc.2"
```

Install matching `@duskmoon-dev/core` for the app's CSS build. With Tailwind v4, import Tailwind, Core, and the Core plugin. Include Rust markup in class scanning if the build removes unused utilities. Use the public `Color`, appearance, size, and native-type props for supported visual states.

```rust
use yew::prelude::*;
use yew_duskmoon::{Button, ButtonAppearance, Card, Color};

#[function_component(App)]
fn app() -> Html {
    html! {
        <Card title={html! { "Quick start" }}>
            <Button appearance={Some(ButtonAppearance::Filled)} color={Some(Color::Primary)}>
                { "Save" }
            </Button>
        </Card>
    }
}
```

Use native HTML ownership for headings, form submitters, dialogs, popovers, and focus. Check Cargo features and actual props before adding a component.

## Rust editor assets

The Rust `code-engine` crate uses a Tree-sitter Worker. Export its bundled syntax assets before Trunk copies the static directory. Serve JavaScript and Wasm with their normal MIME types. The default Worker asset URL is `tree-sitter/` relative to `document.baseURI`, so retain that layout on deployment subpaths or configure `SyntaxService`. Use `duskmoon-code-engine` for the npm editor and web component.

See the [released Yew documentation](https://github.com/duskmoon-dev/duskmoon-web/tree/v2.0.0-rc.2/yew) and [Rust syntax asset guide](https://github.com/duskmoon-dev/duskmoon-web/tree/v2.0.0-rc.2/yew/packages/code-engine) for consumer examples and supported features.
