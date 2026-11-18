defmodule DuskmoonPhoenix.Mixfile do
  use Mix.Project

  @source_url "https://github.com/duskmoon-dev/duskmoon-web"
  @version __DIR__ |> Path.join("VERSION") |> File.read!() |> String.trim()

  def project do
    [
      app: :duskmoon_phoenix,
      version: @version,
      elixir: ">= 1.18.0",
      deps: deps(),
      name: "DuskmoonPhoenix",
      description: "Duskmoon UI component library for Phoenix LiveView",
      package: package(),
      docs: [
        main: "home",
        source_url: @source_url,
        source_ref: "v#{@version}",
        source_url_pattern:
          "#{@source_url}/blob/v#{@version}/phoenix/apps/duskmoon_phoenix/%{path}#L%{line}",
        extras: [
          "guides/home.md",
          "guides/getting-started.md",
          "guides/theming.md",
          "guides/hooks.md",
          "guides/left-menu.md",
          "guides/split-pane.md",
          "guides/react-forms.md",
          "guides/react-chat.md",
          "guides/migrating-to-v11.md",
          "guides/migrating-to-v9.md",
          "guides/upstream-design-alignment.md",
          "guides/migrating-git-components.md",
          "CHANGELOG.md"
        ],
        groups_for_extras: [
          Guides: ~r/guides\/.*/,
          Changelog: ["CHANGELOG.md"]
        ],
        groups_for_modules: [
          Action: [
            DuskmoonPhoenix.Component.Action.Fab,
            DuskmoonPhoenix.Component.Action.Swap,
            DuskmoonPhoenix.Component.Action.Button,
            DuskmoonPhoenix.Component.Action.Dropdown,
            DuskmoonPhoenix.Component.Action.Link,
            DuskmoonPhoenix.Component.Action.Menu,
            DuskmoonPhoenix.Component.Action.Toggle
          ],
          "Data Display": [
            DuskmoonPhoenix.Component.DataDisplay.ReactChat,
            DuskmoonPhoenix.Component.DataDisplay.Carousel,
            DuskmoonPhoenix.Component.DataDisplay.Countdown,
            DuskmoonPhoenix.Component.DataDisplay.Diff,
            DuskmoonPhoenix.Component.DataDisplay.RadialProgress,
            DuskmoonPhoenix.Component.DataDisplay.Accordion,
            DuskmoonPhoenix.Component.DataDisplay.Avatar,
            DuskmoonPhoenix.Component.DataDisplay.Badge,
            DuskmoonPhoenix.Component.DataDisplay.Card,
            DuskmoonPhoenix.Component.DataDisplay.Chip,
            DuskmoonPhoenix.Component.DataDisplay.Collapse,
            DuskmoonPhoenix.Component.DataDisplay.Datetime,
            DuskmoonPhoenix.Component.DataDisplay.Flash,
            DuskmoonPhoenix.Component.DataDisplay.List,
            DuskmoonPhoenix.Component.DataDisplay.Markdown,
            DuskmoonPhoenix.Component.DataDisplay.Pagination,
            DuskmoonPhoenix.Component.DataDisplay.Popover,
            DuskmoonPhoenix.Component.DataDisplay.Progress,
            DuskmoonPhoenix.Component.DataDisplay.Skeleton,
            DuskmoonPhoenix.Component.DataDisplay.Stat,
            DuskmoonPhoenix.Component.DataDisplay.Table,
            DuskmoonPhoenix.Component.DataDisplay.Timeline,
            DuskmoonPhoenix.Component.DataDisplay.Tooltip
          ],
          "Data Entry": [
            DuskmoonPhoenix.Component.DataEntry.FilterGroup,
            DuskmoonPhoenix.Component.DataEntry.Autocomplete,
            DuskmoonPhoenix.Component.DataEntry.Cascader,
            DuskmoonPhoenix.Component.DataEntry.Checkbox,
            DuskmoonPhoenix.Component.DataEntry.CompactInput,
            DuskmoonPhoenix.Component.DataEntry.FileUpload,
            DuskmoonPhoenix.Component.DataEntry.Form,
            DuskmoonPhoenix.Component.DataEntry.ReactForm,
            DuskmoonPhoenix.Component.DataEntry.Input,
            DuskmoonPhoenix.Component.DataEntry.MultiSelect,
            DuskmoonPhoenix.Component.DataEntry.OtpInput,
            DuskmoonPhoenix.Component.DataEntry.PinInput,
            DuskmoonPhoenix.Component.DataEntry.Radio,
            DuskmoonPhoenix.Component.DataEntry.Rating,
            DuskmoonPhoenix.Component.DataEntry.SegmentControl,
            DuskmoonPhoenix.Component.DataEntry.Select,
            DuskmoonPhoenix.Component.DataEntry.Slider,
            DuskmoonPhoenix.Component.DataEntry.Switch,
            DuskmoonPhoenix.Component.DataEntry.Textarea,
            DuskmoonPhoenix.Component.DataEntry.TimeInput,
            DuskmoonPhoenix.Component.DataEntry.TreeSelect
          ],
          Feedback: [
            DuskmoonPhoenix.Component.Feedback.Dialog,
            DuskmoonPhoenix.Component.Feedback.Loading,
            DuskmoonPhoenix.Component.Feedback.Snackbar,
            DuskmoonPhoenix.Component.Feedback.Toast
          ],
          Navigation: [
            DuskmoonPhoenix.Component.Navigation.Megamenu,
            DuskmoonPhoenix.Component.Navigation.Actionbar,
            DuskmoonPhoenix.Component.Navigation.Appbar,
            DuskmoonPhoenix.Component.Navigation.BottomNav,
            DuskmoonPhoenix.Component.Navigation.Breadcrumb,
            DuskmoonPhoenix.Component.Navigation.LeftMenu,
            DuskmoonPhoenix.Component.Navigation.Navbar,
            DuskmoonPhoenix.Component.Navigation.PageFooter,
            DuskmoonPhoenix.Component.Navigation.PageHeader,
            DuskmoonPhoenix.Component.Navigation.Stepper,
            DuskmoonPhoenix.Component.Navigation.Tab
          ],
          Layout: [
            DuskmoonPhoenix.Component.Layout.SidebarLayout,
            DuskmoonPhoenix.Component.Layout.SplitPane,
            DuskmoonPhoenix.Component.Layout.BottomSheet,
            DuskmoonPhoenix.Component.Layout.Divider,
            DuskmoonPhoenix.Component.Layout.Drawer,
            DuskmoonPhoenix.Component.Layout.ThemeSwitcher
          ],
          Icon: [
            DuskmoonPhoenix.Component.Icon.Icons
          ],
          "CSS Art": [
            DuskmoonPhoenix.ArtComponent.ButtonNoise,
            DuskmoonPhoenix.ArtComponent.Eclipse,
            DuskmoonPhoenix.ArtComponent.PlasmaBall,
            DuskmoonPhoenix.ArtComponent.Signature,
            DuskmoonPhoenix.ArtComponent.Snow,
            DuskmoonPhoenix.ArtComponent.SpotlightSearch
          ]
        ],
        nest_modules_by_prefix: [
          DuskmoonPhoenix.Component.Action,
          DuskmoonPhoenix.Component.DataDisplay,
          DuskmoonPhoenix.Component.DataEntry,
          DuskmoonPhoenix.Component.Feedback,
          DuskmoonPhoenix.Component.Navigation,
          DuskmoonPhoenix.Component.Layout,
          DuskmoonPhoenix.Component.Icon,
          DuskmoonPhoenix.ArtComponent
        ],
        skip_undefined_reference_warnings_on: ["CHANGELOG.md"]
      ]
    ]
  end

  def application do
    [
      extra_applications: [:eex, :logger],
      env: [csrf_token_reader: {Plug.CSRFProtection, :get_csrf_token_for, []}]
    ]
  end

  defp deps do
    [
      {:phoenix, "~> 1.8"},
      {:phoenix_html, "~> 4.4"},
      {:phoenix_live_view, "~> 1.2"},
      {:mdex, "~> 0.14"},
      {:mdex_gfm, "~> 0.2"},
      {:mdex_mermaid, "~> 0.4"},
      {:plug, "~> 1.20", optional: true},
      {:jason, "~> 1.4"},
      {:http_fetch, "~> 1.0.0-rc.5", only: :test},
      {:http_web_socket, "~> 1.0.0-rc.5", only: :test},
      {:ex_doc, "~> 0.40", only: :dev, runtime: false}
    ]
  end

  defp package do
    [
      maintainers: ["Jonathan Gao"],
      licenses: ["MIT"],
      files: ~w(lib guides CHANGELOG.md LICENSE mix.exs package.json assets README.md VERSION
           priv/static/mdi_icons.etf.gz priv/static/bsi_icons.etf.gz
           priv/static/assets/js/duskmoon_phoenix.js priv/static/assets/js/manifest.json
           priv/static/assets/css/app.css priv/static/assets/css/manifest.json),
      links: %{
        Changelog: "https://hexdocs.pm/duskmoon_phoenix/changelog.html",
        GitHub: @source_url
      }
    ]
  end
end
