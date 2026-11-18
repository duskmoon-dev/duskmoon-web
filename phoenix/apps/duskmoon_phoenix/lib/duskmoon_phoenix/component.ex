defmodule DuskmoonPhoenix.Component do
  @moduledoc """
  Provides `Duskmoon UI` component for phoenix.

  This library adds a list of Phoenix components.

  """

  @doc """
  Generate a random id format `random-8DFBEE211780394A`
  """

  @spec generate_id() :: String.t()
  def generate_id() do
    "random-#{:crypto.strong_rand_bytes(8) |> Base.encode16()}"
  end

  @doc false
  def live_component do
    quote do
      use Phoenix.LiveComponent

      unquote(html_helpers())
    end
  end

  @doc false
  def html do
    quote do
      use Phoenix.Component

      # Import convenience functions from controllers
      import Phoenix.Controller,
        only: [get_csrf_token: 0]

      # Include general helpers for rendering HTML
      unquote(html_helpers())
    end
  end

  defp html_helpers do
    quote do
      # HTML escaping functionality
      import Phoenix.HTML

      # Shortcut for generating JS commands
      alias Phoenix.LiveView.JS
    end
  end

  @doc false
  def component do
    quote do
      # Action components
      import DuskmoonPhoenix.Component.Action.Fab
      import DuskmoonPhoenix.Component.Action.Swap
      import DuskmoonPhoenix.Component.Action.Button
      import DuskmoonPhoenix.Component.Action.Link
      import DuskmoonPhoenix.Component.Action.Dropdown
      import DuskmoonPhoenix.Component.Action.Menu
      import DuskmoonPhoenix.Component.Action.Toggle

      # Data Display components
      import DuskmoonPhoenix.Component.DataDisplay.Carousel
      import DuskmoonPhoenix.Component.DataDisplay.Countdown
      import DuskmoonPhoenix.Component.DataDisplay.Diff
      import DuskmoonPhoenix.Component.DataDisplay.RadialProgress
      import DuskmoonPhoenix.Component.DataDisplay.Accordion
      import DuskmoonPhoenix.Component.DataDisplay.Collapse
      import DuskmoonPhoenix.Component.DataDisplay.Avatar
      import DuskmoonPhoenix.Component.DataDisplay.Chip
      import DuskmoonPhoenix.Component.DataDisplay.Stat
      import DuskmoonPhoenix.Component.DataDisplay.Badge
      import DuskmoonPhoenix.Component.DataDisplay.Card
      import DuskmoonPhoenix.Component.DataDisplay.Chat
      import DuskmoonPhoenix.Component.DataDisplay.ReactChat
      import DuskmoonPhoenix.Component.DataDisplay.Datetime
      import DuskmoonPhoenix.Component.DataDisplay.Flash
      import DuskmoonPhoenix.Component.DataDisplay.List
      import DuskmoonPhoenix.Component.DataDisplay.Markdown
      import DuskmoonPhoenix.Component.DataEntry.FilterGroup
      import DuskmoonPhoenix.Component.DataEntry.MarkdownInput
      import DuskmoonPhoenix.Component.DataDisplay.Pagination
      import DuskmoonPhoenix.Component.DataDisplay.Popover
      import DuskmoonPhoenix.Component.DataDisplay.Progress
      import DuskmoonPhoenix.Component.DataDisplay.Skeleton
      import DuskmoonPhoenix.Component.DataDisplay.Table
      import DuskmoonPhoenix.Component.DataDisplay.Timeline
      import DuskmoonPhoenix.Component.DataDisplay.Tooltip

      # Data Entry components
      import DuskmoonPhoenix.Component.DataEntry.Autocomplete
      import DuskmoonPhoenix.Component.DataEntry.Cascader
      import DuskmoonPhoenix.Component.DataEntry.CodeEngine
      import DuskmoonPhoenix.Component.DataEntry.FileUpload
      import DuskmoonPhoenix.Component.DataEntry.Form
      import DuskmoonPhoenix.Component.DataEntry.ReactForm
      import DuskmoonPhoenix.Component.DataEntry.Checkbox
      import DuskmoonPhoenix.Component.DataEntry.CompactInput
      import DuskmoonPhoenix.Component.DataEntry.Input
      import DuskmoonPhoenix.Component.DataEntry.MultiSelect
      import DuskmoonPhoenix.Component.DataEntry.OtpInput
      import DuskmoonPhoenix.Component.DataEntry.PinInput
      import DuskmoonPhoenix.Component.DataEntry.Rating
      import DuskmoonPhoenix.Component.DataEntry.Radio
      import DuskmoonPhoenix.Component.DataEntry.SegmentControl
      import DuskmoonPhoenix.Component.DataEntry.Select
      import DuskmoonPhoenix.Component.DataEntry.Slider
      import DuskmoonPhoenix.Component.DataEntry.Switch
      import DuskmoonPhoenix.Component.DataEntry.Textarea
      import DuskmoonPhoenix.Component.DataEntry.TreeSelect
      import DuskmoonPhoenix.Component.DataEntry.TimeInput

      # Feedback components
      import DuskmoonPhoenix.Component.Feedback.Dialog
      import DuskmoonPhoenix.Component.Feedback.Loading
      import DuskmoonPhoenix.Component.Feedback.Toast
      import DuskmoonPhoenix.Component.Feedback.Snackbar

      # Navigation components
      import DuskmoonPhoenix.Component.Navigation.Megamenu
      import DuskmoonPhoenix.Component.Navigation.Actionbar
      import DuskmoonPhoenix.Component.Navigation.Appbar
      import DuskmoonPhoenix.Component.Navigation.BottomNav
      import DuskmoonPhoenix.Component.Navigation.Breadcrumb
      import DuskmoonPhoenix.Component.Navigation.LeftMenu
      import DuskmoonPhoenix.Component.Navigation.Navbar
      import DuskmoonPhoenix.Component.Navigation.PageFooter
      import DuskmoonPhoenix.Component.Navigation.PageHeader
      import DuskmoonPhoenix.Component.Navigation.Stepper
      import DuskmoonPhoenix.Component.Navigation.Tab

      # Layout components
      import DuskmoonPhoenix.Component.Layout.SidebarLayout
      import DuskmoonPhoenix.Component.Layout.SplitPane
      import DuskmoonPhoenix.Component.Layout.BottomSheet
      import DuskmoonPhoenix.Component.Layout.Divider
      import DuskmoonPhoenix.Component.Layout.Drawer
      import DuskmoonPhoenix.Component.Layout.ThemeSwitcher

      # Icon components
      import DuskmoonPhoenix.Component.Icon.Icons

      # Art components
      import DuskmoonPhoenix.ArtComponent.Atom
      import DuskmoonPhoenix.ArtComponent.CatStargazer
      import DuskmoonPhoenix.ArtComponent.CircularGallery
      import DuskmoonPhoenix.ArtComponent.ColorSpin
      import DuskmoonPhoenix.ArtComponent.Eclipse
      import DuskmoonPhoenix.ArtComponent.FlowerAnimation
      import DuskmoonPhoenix.ArtComponent.Moon
      import DuskmoonPhoenix.ArtComponent.Mountain
      import DuskmoonPhoenix.ArtComponent.PlasmaBall
      import DuskmoonPhoenix.ArtComponent.Snow
      import DuskmoonPhoenix.ArtComponent.Sun
      import DuskmoonPhoenix.ArtComponent.SynthwaveStarfield
    end
  end

  @doc false
  defmacro __using__(which) when is_atom(which) do
    apply(__MODULE__, which, [])
  end

  defmacro __using__(_) do
    quote do
      unquote(component())
    end
  end
end
