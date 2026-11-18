defmodule NativeConsumer.Page do
  use Phoenix.LiveView

  import DuskmoonPhoenix.Component.Action.Button
  import DuskmoonPhoenix.Component.Icon.Icons

  def mount(_params, _session, socket) do
    {:ok, assign(socket, clicks: 0, submits: 0, payload: %{}, form: to_form(%{}, as: :sample))}
  end

  def render(assigns) do
    ~H"""
    <main>
      <h1>Staged native Duskmoon Phoenix</h1>
      <.dm_mdi id="staged-icon" name="home" />
      <.form id="native-form" for={@form} phx-submit="save">
        <label for="entry">Name</label>
        <input id="entry" name="sample[name]" value="" required />
      </.form>
      <.dm_btn id="save" type="submit" form="native-form" name="commit" value="publish">
        Publish
      </.dm_btn>
      <.dm_btn id="click" phx-click="count" phx-value-choice="native">Count</.dm_btn>
      <output id="counts">{@clicks}/{@submits}</output>
      <output id="payload">{JSON.encode!(@payload)}</output>
    </main>
    """
  end

  def handle_event("count", %{"choice" => "native"}, socket) do
    {:noreply, update(socket, :clicks, &(&1 + 1))}
  end

  def handle_event("save", payload, socket) do
    {:noreply, socket |> update(:submits, &(&1 + 1)) |> assign(:payload, payload)}
  end
end

defmodule NativeConsumer.Layout do
  use Phoenix.Component

  def root(assigns) do
    ~H"""
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="csrf-token" content={Plug.CSRFProtection.get_csrf_token()} />
        <link rel="icon" href="data:," />
      <link rel="stylesheet" href="/assets/app.css" />
        <script type="module" src="/assets/app.js"></script>
        <title>Staged native Duskmoon Phoenix</title>
      </head>
      <body>{@inner_content}</body>
    </html>
    """
  end
end

defmodule NativeConsumer.Router do
  use Phoenix.Router
  import Phoenix.LiveView.Router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :put_root_layout, html: {NativeConsumer.Layout, :root}
    plug :protect_from_forgery
  end

  scope "/" do
    pipe_through :browser
    live "/", NativeConsumer.Page
  end
end

defmodule NativeConsumer.Endpoint do
  use Phoenix.Endpoint, otp_app: :native_consumer

  @session [store: :cookie, key: "_duskmoon_fixture", signing_salt: "fixture-session"]
  socket "/live", Phoenix.LiveView.Socket, websocket: [connect_info: [session: @session]]

  plug Plug.Static, at: "/assets", from: Path.expand("public")
  plug Plug.Session, @session
  plug NativeConsumer.Router
end

port = System.fetch_env!("PORT") |> String.to_integer()

Application.put_env(:native_consumer, NativeConsumer.Endpoint,
  server: true,
  url: [host: "127.0.0.1", port: port],
  http: [ip: {127, 0, 0, 1}, port: port],
  adapter: Bandit.PhoenixAdapter,
  pubsub_server: NativeConsumer.PubSub,
  live_view: [signing_salt: "fixture-live"],
  secret_key_base: String.duplicate("duskmoon-consumer", 8)
)

true = Code.ensure_loaded?(DuskmoonPhoenix.Component.Action.Button)
false = Code.ensure_loaded?(DuskmoonBundler.Builder)
false = Code.ensure_loaded?(Hologram.Router)

{:ok, _} =
  Supervisor.start_link(
    [{Phoenix.PubSub, name: NativeConsumer.PubSub}, NativeConsumer.Endpoint],
    strategy: :one_for_one
  )

Process.sleep(:infinity)
