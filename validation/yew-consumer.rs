#[cfg(target_arch = "wasm32")]
fn main() {
    use code_engine::{CodeEditor, CodeLanguage};
    use yew::prelude::*;
    use yew_duskmoon::{Button, Dialog};

    #[function_component]
    fn App() -> Html {
        html! {
            <main class="mt-7">
                <Button>{"Open editor"}</Button>
                <Dialog id="editor" aria_label="Editor">
                    <CodeEditor language={CodeLanguage::Rust} />
                </Dialog>
            </main>
        }
    }

    yew::Renderer::<App>::new().render();
}

#[cfg(not(target_arch = "wasm32"))]
fn main() {
    let rendered = yew_duskmoon::render_markdown_to_html(
        "**Hello Web**\n\n```mermaid\nflowchart LR\nA[Markdown] --> B[HTML]\n```",
    );
    assert!(rendered.contains("<strong>Hello Web</strong>"));
    assert!(rendered.contains("dm-mermaid-flowchart"));
    code_engine::write_syntax_assets("public/tree-sitter").unwrap();
}
