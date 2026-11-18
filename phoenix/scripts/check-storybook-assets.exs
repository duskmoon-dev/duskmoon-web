defmodule StorybookAssetCheck do
  @react "react.transitional.element"
  @registration ~r/\bcustomElements\.define\s*\(/

  def run! do
    assets = "apps/duskmoon_storybook/priv/static/assets"
    native = read_graph!(Path.join(assets, "js"))
    react = read_graph!(Path.join(assets, "react/js"))

    require!(
      !Enum.any?(native.sources, &String.contains?(&1, @react)),
      "React in native/Elements graph"
    )

    require!(
      Enum.count(react.sources, &String.contains?(&1, @react)) == 1,
      "Expected one React runtime"
    )

    require!(
      !Enum.any?(react.sources, &Regex.match?(@registration, &1)),
      "Elements in React graph"
    )

    native_startup = static_sources(native, "app.js")
    react_startup = static_sources(react, "react_features.js")

    require!(
      !Enum.any?(native_startup, &Regex.match?(@registration, &1)),
      "Elements in native startup"
    )

    require!(
      !Enum.any?(react_startup, &String.contains?(&1, @react)),
      "React in feature loader startup"
    )

    IO.puts("Storybook native, Elements, and React artifact boundaries verified")
  end

  defp read_graph!(dir) do
    %{"entries" => entries} =
      dir |> Path.join("manifest.json") |> File.read!() |> JSON.decode!()

    sources =
      Map.new(entries, fn {name, %{"file" => file}} ->
        {name, File.read!(Path.join(dir, file))}
      end)

    %{entries: entries, sources: Map.values(sources), by_name: sources}
  end

  defp static_sources(graph, root) do
    static_files(graph.entries, [root], MapSet.new())
    |> Enum.map(&Map.fetch!(graph.by_name, &1))
  end

  defp static_files(_entries, [], seen), do: seen

  defp static_files(entries, [name | rest], seen) do
    if MapSet.member?(seen, name) do
      static_files(entries, rest, seen)
    else
      imports = entries |> Map.fetch!(name) |> Map.fetch!("imports")
      static_files(entries, imports ++ rest, MapSet.put(seen, name))
    end
  end

  defp require!(true, _message), do: :ok
  defp require!(false, message), do: raise(message)
end

StorybookAssetCheck.run!()
