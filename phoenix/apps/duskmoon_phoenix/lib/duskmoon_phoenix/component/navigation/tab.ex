defmodule DuskmoonPhoenix.Component.Navigation.Tab do
  @moduledoc """
  Core-styled tablist with native tab buttons and tab panels.

  ## Examples

      <.dm_tab id="demo-tabs" active_tab_index={0}>
        <:tab>Menu1</:tab>
        <:tab>Menu2</:tab>
        <:tab_content>Menu1 Content</:tab_content>
        <:tab_content>Menu2 Content</:tab_content>
      </.dm_tab>

  """
  use Phoenix.Component

  @doc """
  Generates a tabbed interface with an initially selected panel.

  With `DuskmoonTabs`, tabs without LiveView click handlers select a local panel
  and keep its DOM when switching. When any tab has `phx_click`, LiveView owns
  selection and only the active panel's contents render. Arrow keys move focus
  without sending an event in LiveView mode. Enter and Space activate the focused
  button through its normal click handler. Supply a stable `id` in LiveView.


  ## Examples

      <.dm_tab id="demo-tabs" active_tab_index={0}>
        <:tab>Tab 1</:tab>
        <:tab>Tab 2</:tab>
        <:tab_content>Content for Tab 1</:tab_content>
        <:tab_content>Content for Tab 2</:tab_content>
      </.dm_tab>

      <.dm_tab id="settings-tabs" active_tab_name="settings">
        <:tab name="profile">Profile</:tab>
        <:tab name="settings">Settings</:tab>
        <:tab_content name="profile">Profile content</:tab_content>
        <:tab_content name="settings">Settings content</:tab_content>
      </.dm_tab>

  """
  @doc type: :component
  attr(:id, :any, default: nil, doc: "HTML id attribute")
  attr(:class, :any, default: nil, doc: "Additional CSS classes")
  attr(:header_class, :any, default: nil, doc: "CSS classes for tab header")

  attr(:orientation, :string,
    default: "horizontal",
    values: ["horizontal", "vertical"],
    doc: "Tab orientation"
  )

  attr(:active_tab_index, :integer,
    default: 0,
    doc: "Index of active tab (when not using named tabs)"
  )

  attr(:active_tab_name, :string,
    default: "",
    doc: "Name of active tab (for named tab matching)"
  )

  attr(:variant, :string,
    default: nil,
    values: [nil, "lifted", "bordered", "boxed"],
    doc: "Tab style variant"
  )

  attr(:size, :string,
    default: nil,
    values: [nil, "xs", "sm", "md", "lg"],
    doc: "Tab size"
  )

  attr(:content_class, :any, default: nil, doc: "CSS classes for tab content")

  attr(:rest, :global)

  slot(:tab,
    required: false,
    doc: "Tab button"
  ) do
    attr(:id, :any, doc: "tab button HTML id")
    attr(:class, :any, doc: "tab button CSS classes")
    attr(:name, :string, doc: "Tab name for matching with tab_content")
    attr(:phx_click, :any, doc: "Phoenix click event")
  end

  slot(:tab_content,
    required: false,
    doc: "Tab content panel"
  ) do
    attr(:id, :any, doc: "tab content panel HTML id")
    attr(:class, :any, doc: "tab content panel CSS classes")
    attr(:name, :string, doc: "Content name for matching with tab")
  end

  def dm_tab(assigns) do
    named? = assigns.active_tab_name != ""
    tabs = build_entries(assigns.tab, assigns.id, "tab", named?)
    panels = build_entries(assigns.tab_content, assigns.id, "panel", named?)

    active_key =
      if assigns.active_tab_name == "",
        do: "index:#{assigns.active_tab_index}",
        else: "name:#{assigns.active_tab_name}"

    assigns =
      assign(assigns,
        tabs: tabs,
        panels: panels,
        tab_ids: entry_ids(tabs),
        panel_ids: entry_ids(panels),
        controlled: Enum.any?(assigns.tab, & &1[:phx_click]),
        active_key: active_key
      )

    ~H"""
    <div
      id={@id}
      phx-hook={@id && "DuskmoonTabs"}
      data-dm-tabs
      data-active-key={@active_key}
      data-controlled={to_string(@controlled)}
      class={[
        @orientation == "vertical" && "flex items-start",
        @class
      ]}
      {@rest}
    >
      <div
        class={[
          "tabs",
          @orientation == "vertical" && "tabs-vertical",
          @variant && "tabs-#{@variant}",
          @size && "tabs-#{@size}",
          @header_class
        ]}
        role="tablist"
        aria-orientation={@orientation}
      >
        <button
          :for={tab <- @tabs}
          type="button"
          id={tab.id}
          class={["tab", @size == "xs" && "tab-xs", tab.slot[:class]]}
          role="tab"
          data-tab-key={tab.key}
          data-tab-name={tab.slot[:name]}
          data-tab-index={tab.index}
          tabindex={if tab.key == @active_key, do: 0, else: -1}
          aria-selected={to_string(tab.key == @active_key)}
          aria-controls={@panel_ids[tab.key]}
          phx-click={tab.slot[:phx_click]}
        >
          {render_slot(tab.slot)}
        </button>
      </div>
      <div
        :for={panel <- @panels}
        role="tabpanel"
        id={panel.id}
        class={["tab-panel", @content_class, panel.slot[:class]]}
        data-panel-key={panel.key}
        data-panel-name={panel.slot[:name]}
        data-panel-index={panel.index}
        data-active={to_string(panel.key == @active_key)}
        hidden={panel.key != @active_key}
        tabindex="0"
        aria-labelledby={@tab_ids[panel.key]}
      >
        {if !@controlled || panel.key == @active_key, do: render_slot(panel.slot)}
      </div>
    </div>
    """
  end

  defp build_entries(slots, id, role, named?) do
    slots
    |> Enum.with_index()
    |> Enum.map(fn {slot, index} ->
      %{
        key: if(named?, do: "name:#{slot[:name]}", else: "index:#{index}"),
        id: slot[:id] || (id && "#{id}-#{role}-#{index}"),
        index: index,
        slot: slot
      }
    end)
  end

  defp entry_ids(entries), do: Map.new(entries, &{&1.key, &1.id})
end
