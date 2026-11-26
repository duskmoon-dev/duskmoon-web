defmodule Storybook.DataDisplay.ReactVisualization do
  use PhoenixStorybook.Story, :example
  import DuskmoonPhoenix.Component.DataDisplay.ReactVisualization

  def doc, do: "A React chart with revisioned LiveView data and selection and brush events."

  @chart_id "storybook-react-visualization"

  @impl true
  def mount(_, _, socket) do
    chart = %{
      kind: "line",
      xAxis: %{type: "numeric", label: "Day"},
      yAxis: %{type: "numeric", label: "Requests"},
      series: [
        %{
          id: "requests",
          name: "Requests",
          data: [
            %{id: "day-1", x: 1, y: 12},
            %{id: "day-2", x: 2, y: nil},
            %{id: "day-3", x: 3, y: 17},
            %{id: "day-4", x: 4, y: 13}
          ]
        }
      ],
      options: %{title: "Daily requests", marker: %{visible: true}}
    }

    {:ok, assign(socket, chart: chart, chart_id: @chart_id, revision: 0, last_event: nil)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="p-4">
      <.dm_react_visualization
        id={@chart_id}
        chart={@chart}
        revision={@revision}
        sync_event="visualization.sync"
      />
      <button class="btn btn-sm" type="button" phx-click="update_chart">Update chart</button>
      <p :if={@last_event} role="status">{@last_event}</p>
    </div>
    """
  end

  @impl true
  def handle_event("update_chart", _, socket) do
    chart = socket.assigns.chart

    chart =
      update_in(chart.series, fn [series] ->
        [update_in(series.data, fn [first | rest] -> [%{first | y: first.y + 2} | rest] end)]
      end)

    socket = assign(socket, chart: chart, revision: socket.assigns.revision + 1)
    {:noreply, send_snapshot(socket)}
  end

  def handle_event("visualization.sync", %{"id" => @chart_id}, socket),
    do: {:noreply, send_snapshot(socket)}

  def handle_event(
        "visualization.event",
        %{"id" => @chart_id, "revision" => revision, "event" => %{"type" => type}},
        %{assigns: %{revision: revision}} = socket
      )
      when type in ["selection", "brush"] do
    {:noreply, assign(socket, :last_event, "Received #{type}")}
  end

  def handle_event("visualization.event", _, socket), do: {:noreply, socket}

  defp send_snapshot(socket) do
    push_event(socket, "visualization.update", %{
      id: @chart_id,
      chart: socket.assigns.chart,
      revision: socket.assigns.revision
    })
  end
end
