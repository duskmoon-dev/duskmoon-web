defmodule DuskmoonPhoenix.Component.Action.Menu do
  @moduledoc """
  Native popover action menu and menu-item button.

  Renders a dropdown/context menu anchored to a trigger element with full
  keyboard navigation, proper ARIA roles, and click-outside dismissal.

  ## Examples

      <button id="actions-trigger" type="button" class="btn btn-primary" popovertarget="actions">
        Actions
      </button>
      <.dm_menu id="actions" anchor="#actions-trigger">
        <.dm_menu_item value="edit">Edit</.dm_menu_item>
        <.dm_menu_item value="copy">Copy</.dm_menu_item>
        <.dm_menu_item value="delete">Delete</.dm_menu_item>
      </.dm_menu>

      <button id="ctx-trigger" type="button" class="btn" popovertarget="ctx">
        Options
      </button>
      <.dm_menu id="ctx" anchor="#ctx-trigger" placement="bottom-end">
        <.dm_menu_item value="profile" icon="account">Profile</.dm_menu_item>
        <.dm_menu_item value="settings" icon="cog">Settings</.dm_menu_item>
        <.dm_menu_item value="logout" icon="logout" disabled>Logout</.dm_menu_item>
      </.dm_menu>

  """
  use Phoenix.Component

  import DuskmoonPhoenix.Component.Icon.Icons

  @doc """
  Renders a native popover positioned at its trigger. Use the same stable ID in
  the menu and the trigger's `popovertarget` attribute. The `anchor` selector is
  used for focus restoration and to position programmatically opened menus.

  The native methods are `showPopover({source: trigger})`, `hidePopover()` and
  `togglePopover({source: trigger})`. With the DuskmoonMenu hook, setting `open`
  on a render opens or closes the popover. Selecting an enabled item emits one
  bubbling `select` event with `detail.value`.

  ## Examples

      <button id="my-btn" type="button" class="btn" popovertarget="my-menu">Open</button>
      <.dm_menu id="my-menu" anchor="#my-btn" placement="bottom-start">
        <.dm_menu_item value="one">Item 1</.dm_menu_item>
        <.dm_menu_item value="two">Item 2</.dm_menu_item>
      </.dm_menu>

  """
  @doc type: :component
  attr(:id, :any, default: nil, doc: "HTML id attribute")
  attr(:class, :any, default: nil, doc: "additional CSS classes")
  attr(:open, :boolean, default: false, doc: "whether the menu is initially visible")

  attr(:anchor, :string,
    default: nil,
    doc: "CSS selector of the anchor/trigger element"
  )

  attr(:placement, :string,
    default: "bottom-start",
    values: [
      "top",
      "bottom",
      "left",
      "right",
      "top-start",
      "top-end",
      "bottom-start",
      "bottom-end"
    ],
    doc: "preferred placement of the menu"
  )

  attr(:label, :string, default: nil, doc: "Accessible label for the menu (aria-label)")
  attr(:rest, :global)
  slot(:inner_block, required: true, doc: "Menu items")

  def dm_menu(assigns) do
    ~H"""
    <div
      id={@id}
      phx-hook={@id && "DuskmoonMenu"}
      popover="auto"
      data-dm-menu
      data-open={to_string(@open)}
      data-anchor={@anchor}
      data-placement={@placement}
      class={["menu menu-vertical", @class]}
      role="menu"
      aria-label={@label}
      {@rest}
    >
      {render_slot(@inner_block)}
    </div>
    """
  end

  @doc """
  Renders a native menu item. Pass `phx-click` and `phx-value-*` for LiveView actions.

  ## Examples

      <.dm_menu_item value="edit">Edit</.dm_menu_item>
      <.dm_menu_item value="settings" icon="cog">Settings</.dm_menu_item>
      <.dm_menu_item value="delete" disabled>Delete</.dm_menu_item>

  """
  @doc type: :component
  attr(:value, :string, default: nil, doc: "value emitted in the select event")
  attr(:disabled, :boolean, default: false, doc: "whether the item is disabled")
  attr(:icon, :string, default: nil, doc: "MDI icon name shown before content")
  attr(:class, :any, default: nil, doc: "additional CSS classes")
  attr(:rest, :global)
  slot(:inner_block, required: true, doc: "Item label content")

  def dm_menu_item(assigns) do
    ~H"""
    <button
      type="button"
      value={@value}
      disabled={@disabled}
      class={["menu-item", @class]}
      role="menuitem"
      tabindex="-1"
      aria-disabled={@disabled && "true"}
      {@rest}
    >
      <.dm_mdi :if={@icon} name={@icon} class="w-5 h-5" aria-hidden="true" data-menu-icon />
      {render_slot(@inner_block)}
    </button>
    """
  end
end
