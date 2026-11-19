use wasm_bindgen::JsCast;
use yew::prelude::*;
use yew_hooks::use_event_with_window;
use yewdux::prelude::*;

use crate::states::config::ConfigStore;

use yew_duskmoon::button::ButtonType;
use yew_duskmoon::typography::TypographyLevel;
use yew_duskmoon::{AppHeader, Button, Dropdown, Link, ThemeController, Typography};

use crate::routes::AppRoute;

fn apply_theme_mode(mode: &str) {
    let Some(window) = web_sys::window() else {
        return;
    };
    let Some(document) = window.document() else {
        return;
    };
    let Some(root) = document.document_element() else {
        return;
    };

    let resolved_theme = match mode {
        "sunshine" => Some("sunshine"),
        "duskmoon" => Some("moonlight"),
        _ => None,
    };

    if let Some(theme) = resolved_theme {
        let _ = root.set_attribute("data-theme", theme);
    } else {
        let _ = root.remove_attribute("data-theme");
    }

    let _ = root.set_attribute("data-theme-mode", mode);
}

fn close_navigation() {
    if let Some(panel) = web_sys::window()
        .and_then(|window| window.document())
        .and_then(|document| document.get_element_by_id("site-navigation"))
        .and_then(|element| element.dyn_into::<web_sys::HtmlElement>().ok())
    {
        let _ = panel.hide_popover();
    }
}

/// Header component
#[function_component(Header)]
pub fn header() -> Html {
    let (state, dispatch) = use_store::<ConfigStore>();

    let text_transform_class = match state.name.as_str() {
        "uppercase" => "uppercase",
        "lowercase" => "lowercase",
        "capitalize" => "capitalize",
        _ => "",
    };
    let theme_mode = state.theme_mode.clone();
    let select_auto = dispatch.reduce_mut_callback(|config| config.theme_mode = "auto".to_string());
    let select_sunshine =
        dispatch.reduce_mut_callback(|config| config.theme_mode = "sunshine".to_string());
    let select_duskmoon =
        dispatch.reduce_mut_callback(|config| config.theme_mode = "duskmoon".to_string());

    {
        let theme_mode = theme_mode.clone();
        use_effect_with(theme_mode, |mode| {
            apply_theme_mode(mode);
        });
    }

    use_event_with_window("resize", |_: Event| {
        let toggle = web_sys::window()
            .and_then(|window| window.document())
            .and_then(|document| document.query_selector(".site-menu-toggle").ok().flatten());
        if toggle.is_some_and(|toggle| toggle.client_width() == 0) {
            close_navigation();
        }
    });

    let navigation = html! {
        <>
            <Link<AppRoute> to={AppRoute::Home} classes="site-nav-link">
                <span class="nav-index">{ "01" }</span>
                { "Home" }
            </Link<AppRoute>>
            <Link<AppRoute> to={AppRoute::ComponentsRoot} classes="site-nav-link">
                <span class="nav-index">{ "02" }</span>
                { "Components" }
            </Link<AppRoute>>
            <Link<AppRoute> to={AppRoute::About} classes="site-nav-link">
                <span class="nav-index">{ "03" }</span>
                { "About" }
            </Link<AppRoute>>
        </>
    };

    let theme_switch = |name: &'static str| {
        html! {
            <ThemeController class={classes!("appbar-theme-switch", "theme-controller-sm")}>
                { for [
                    ("auto", "Auto", select_auto.clone()),
                    ("sunshine", "Light", select_sunshine.clone()),
                    ("duskmoon", "Dark", select_duskmoon.clone()),
                ].into_iter().map(|(mode, label, onclick)| html! {
                    <label class="theme-choice">
                        <input
                            class="theme-controller-item"
                            type="radio"
                            name={name}
                            checked={theme_mode == mode}
                            {onclick}
                        />
                        <span class="theme-controller-label">{ label }</span>
                    </label>
                }) }
            </ThemeController>
        }
    };

    html! {
      <AppHeader
        classes={classes!("site-header", text_transform_class)}
        logo={
          html! {
            <Link<AppRoute>
              to={AppRoute::Home}
              classes="brand-anchor"
            >
              <span class="brand-mark">{ "DM" }</span>
              <span class="brand-copy">
                <Typography level={TypographyLevel::H3} classes="brand-title">
                  { "Duskmoon UI" }
                </Typography>
                <span class="brand-caption">{ "Yew component field guide" }</span>
              </span>
            </Link<AppRoute>>
          }
        }
        menu={navigation.clone()}
        info={
          html! {
            <div class="appbar-actions">
              { theme_switch("app-theme") }

              <Dropdown
                id="site-navigation"
                trigger_label="Menu"
                class="site-navigation-dropdown"
                trigger_class="btn site-menu-toggle"
                content_class="site-navigation-panel"
              >
                <div class="site-navigation-links" onclick={Callback::from(|_: MouseEvent| close_navigation())}>
                  { navigation }
                  <a
                    class="site-nav-link site-navigation-source"
                    href="https://github.com/duskmoon-dev/duskmoon-web/tree/main/yew"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    { "Source" }
                  </a>
                </div>
                <div class="site-navigation-theme">
                  { theme_switch("menu-theme") }
                </div>
              </Dropdown>

              <Button
                r#type={ButtonType::Link}
                href={"https://github.com/duskmoon-dev/duskmoon-web/tree/main/yew"}
                target={"_blank"}
                rel={"noopener noreferrer"}
                classes="repo-button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1.75em" fill="white">
                  <path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z" />
                </svg>
                <span>{ "Source" }</span>
              </Button>
            </div>
          }
        }
      />
    }
}
