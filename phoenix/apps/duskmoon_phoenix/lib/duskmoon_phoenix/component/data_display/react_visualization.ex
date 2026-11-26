defmodule DuskmoonPhoenix.Component.DataDisplay.ReactVisualization do
  @moduledoc """
  An opt-in mount for Duskmoon React charts. Register the hook from
  `duskmoon_phoenix/react-visualization` when a LiveView uses this component.
  """
  use Phoenix.Component

  attr(:id, :string, required: true)
  attr(:chart, :map, required: true)
  attr(:revision, :integer, default: 0)
  attr(:selection, :list, default: nil)
  attr(:viewport, :map, default: nil)
  attr(:hidden_series_ids, :list, default: nil)
  attr(:event, :string, default: "visualization.event")
  attr(:sync_event, :string, default: nil)
  attr(:target, :any, default: nil)
  attr(:class, :any, default: nil)
  attr(:rest, :global)

  @doc """
  Updates carry the same chart ID and a larger revision through
  `push_event(socket, "visualization.update", payload)`. Selection and brush
  commits are sent to the owning LiveView or LiveComponent.
  """
  def dm_react_visualization(assigns) do
    snapshot =
      %{chart: assigns.chart, revision: assigns.revision}
      |> put_if_present(:selection, assigns.selection)
      |> put_if_present(:viewport, assigns.viewport)
      |> put_if_present(:hiddenSeriesIds, assigns.hidden_series_ids)
      |> JSON.encode!()

    assigns = assign(assigns, :snapshot, snapshot)

    ~H"""
    <div
      id={@id}
      class={@class}
      phx-hook="DuskmoonReactVisualization"
      phx-update="ignore"
      data-visualization={@snapshot}
      data-event={@event}
      data-sync-event={@sync_event}
      data-target={@target}
      {@rest}
    >
      <div role="status" data-dm-hook-status data-loading="Loading chart…">Loading chart…</div>
      <div data-dm-visualization-mount></div>
    </div>
    """
  end

  defp put_if_present(map, _key, nil), do: map
  defp put_if_present(map, key, value), do: Map.put(map, key, value)
end
