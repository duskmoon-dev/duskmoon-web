defmodule DuskmoonPhoenix.Component.Navigation.NativeControlsBrowserTest do
  use ExUnit.Case, async: false

  import Phoenix.Component, only: [sigil_H: 2]
  import Phoenix.LiveViewTest
  import DuskmoonPhoenix.Component.Action.Menu
  import DuskmoonPhoenix.Component.Navigation.Tab

  alias DuskmoonBundler.Integration.CDPBrowser

  @moduletag :integration

  setup_all do
    {:ok, browser} = CDPBrowser.start_link()
    on_exit(fn -> CDPBrowser.stop(browser) end)
    %{browser: browser}
  end

  setup %{browser: browser} do
    {:ok, page} = CDPBrowser.new_page(browser)
    on_exit(fn -> CDPBrowser.close_page(page) end)
    %{page: page}
  end

  test "menu keyboard movement skips disabled items and one selection restores trigger focus", %{
    page: page
  } do
    component =
      render_component(fn assigns ->
        ~H"""
        <button id="trigger" type="button" popovertarget="actions" aria-haspopup="menu">
          Actions
        </button>
        <.dm_menu id="actions" anchor="#trigger">
          <.dm_menu_item value="edit">Edit</.dm_menu_item>
          <.dm_menu_item value="copy">Copy</.dm_menu_item>
          <.dm_menu_item value="remove" disabled>Remove</.dm_menu_item>
        </.dm_menu>
        """
      end)

    :ok = load_fixture(page, component, "menu", "initMenu", "#actions")

    assert {:ok,
            %{
              "expanded" => "true",
              "first" => "edit",
              "last" => "copy",
              "values" => ["copy"],
              "closed" => true,
              "focus" => "trigger"
            }} =
             CDPBrowser.evaluate(page, """
             (async () => {
               const trigger = document.getElementById("trigger");
               const menu = document.getElementById("actions");
               const values = [];
               menu.addEventListener("select", (event) => values.push(event.detail.value));
               const opened = new Promise(resolve => menu.addEventListener("open", resolve, {once:true}));
               trigger.focus();
               trigger.click();
               await opened;
               const expanded = trigger.getAttribute("aria-expanded");
               const first = document.activeElement.value;
               document.activeElement.dispatchEvent(new KeyboardEvent("keydown", {
                 key: "End", bubbles: true, cancelable: true
               }));
               const last = document.activeElement.value;
               document.activeElement.click();
               return {expanded, first, last, values, closed: !menu.matches(":popover-open"), focus: document.activeElement.id};
             })()
             """)
  end

  test "local tabs link and display their panels and wrap keyboard selection", %{page: page} do
    component =
      render_component(fn assigns ->
        ~H"""
        <.dm_tab id="tabs" active_tab_name="profile">
          <:tab id="profile" name="profile">Profile</:tab>
          <:tab id="settings" name="settings">Settings</:tab>
          <:tab_content id="settings-panel" name="settings">Settings contents</:tab_content>
          <:tab_content id="profile-panel" name="profile">Profile contents</:tab_content>
        </.dm_tab>
        """
      end)

    :ok = load_fixture(page, component, "tabs", "initTabs", "#tabs")

    assert {:ok,
            %{
              "linked" => true,
              "next" => %{
                "focus" => "settings",
                "visible" => "settings-panel",
                "selected" => ["false", "true"]
              },
              "wrapped" => %{
                "focus" => "profile",
                "visible" => "profile-panel",
                "selected" => ["true", "false"]
              },
              "changes" => [
                %{"value" => "settings", "oldValue" => "profile"},
                %{"value" => "profile", "oldValue" => "settings"}
              ]
            }} =
             CDPBrowser.evaluate(page, """
             (() => {
               const group = document.getElementById("tabs");
               const tabs = [...group.querySelectorAll("[role=tab]")];
               const panels = [...group.querySelectorAll("[role=tabpanel]")];
               const linked = tabs.every((tab) =>
                 document.getElementById(tab.getAttribute("aria-controls")).getAttribute("aria-labelledby") === tab.id);
               const changes = [];
               group.addEventListener("change", (event) => changes.push(event.detail));
               const nextKey = () => document.activeElement.dispatchEvent(new KeyboardEvent("keydown", {
                 key: "ArrowRight", bubbles: true, cancelable: true
               }));
               const state = () => ({
                 focus: document.activeElement.id,
                 selected: tabs.map((tab) => tab.getAttribute("aria-selected")),
                 visible: panels.find((panel) => !panel.hidden).id
               });
               tabs[0].focus();
               nextKey();
               const next = state();
               nextKey();
               return {linked, next, wrapped: state(), changes};
             })()
             """)
  end

  defp load_fixture(page, component, source, initializer, selector) do
    js = Path.expand("../../../../assets/js/hooks/#{source}.js", __DIR__) |> File.read!()

    html = """
    <!doctype html><html lang="en"><body>
    #{component}
    <script type="module">
      #{js}
      #{initializer}(document.querySelector(#{Jason.encode!(selector)}));
    </script>
    </body></html>
    """

    CDPBrowser.goto(page, "data:text/html;base64," <> Base.encode64(html))
  end
end
