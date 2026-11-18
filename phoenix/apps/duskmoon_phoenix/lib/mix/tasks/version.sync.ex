defmodule Mix.Tasks.Version.Sync do
  @moduledoc """
  Syncs version numbers across all project files.

  This task reads the version from apps/duskmoon_phoenix/mix.exs and updates:
  - apps/duskmoon_phoenix/package.json
  - mix.exs (umbrella)

  ## Usage

      mix version.sync

  ## When to use

  - After pulling changes from main branch
  - When version numbers appear out of sync
  - Before creating a local build for testing

  ## Note

  Commit the UI version before running the UI Release workflow.
  This task synchronizes the umbrella and npm manifests with that version.
  """

  use Mix.Task

  @shortdoc "Syncs version numbers across all project files"

  @impl Mix.Task
  def run(_args) do
    # Ensure we're in the umbrella root
    # Mix tasks run from the project root already, so we should be fine
    # But let's ensure we can find the files

    duskmoon_phoenix_mix_path =
      if File.exists?("apps/duskmoon_phoenix/mix.exs") do
        "apps/duskmoon_phoenix/mix.exs"
      else
        # We're in a child app, go up to umbrella
        "../../apps/duskmoon_phoenix/mix.exs"
      end

    # Read version from duskmoon_phoenix mix.exs
    duskmoon_phoenix_mix = File.read!(duskmoon_phoenix_mix_path)

    version =
      case Regex.run(~r/@version "([^"]+)"/, duskmoon_phoenix_mix) do
        [_, version] ->
          version

        nil ->
          Mix.raise("Could not find version in apps/duskmoon_phoenix/mix.exs")
      end

    Mix.shell().info("Found version: #{version}")

    # Update package.json
    update_package_json(version)

    # Update umbrella mix.exs
    update_umbrella_mix(version)

    Mix.shell().info([:green, "✓ All version files synchronized to #{version}"])
  end

  defp update_package_json(version) do
    package_json_path =
      cond do
        File.exists?("apps/duskmoon_phoenix/package.json") ->
          "apps/duskmoon_phoenix/package.json"

        File.exists?("../../apps/duskmoon_phoenix/package.json") ->
          "../../apps/duskmoon_phoenix/package.json"

        true ->
          Mix.raise("Could not find apps/duskmoon_phoenix/package.json")
      end

    content = File.read!(package_json_path)

    updated_content =
      Regex.replace(
        ~r/"version": "[^"]+"/,
        content,
        "\"version\": \"#{version}\""
      )

    if content != updated_content do
      File.write!(package_json_path, updated_content)
      Mix.shell().info("  Updated #{package_json_path}")
    else
      Mix.shell().info("  #{package_json_path} already at #{version}")
    end
  end

  defp update_umbrella_mix(version) do
    umbrella_mix_path =
      cond do
        File.exists?("mix.exs") and
            not String.contains?(File.read!("mix.exs"), "DuskmoonPhoenix.Mixfile") ->
          "mix.exs"

        File.exists?("../../mix.exs") ->
          "../../mix.exs"

        true ->
          Mix.raise("Could not find umbrella mix.exs")
      end

    content = File.read!(umbrella_mix_path)

    updated_content =
      Regex.replace(
        ~r/@version "[^"]+"/,
        content,
        "@version \"#{version}\""
      )

    if content != updated_content do
      File.write!(umbrella_mix_path, updated_content)
      Mix.shell().info("  Updated #{umbrella_mix_path}")
    else
      Mix.shell().info("  #{umbrella_mix_path} already at #{version}")
    end
  end
end
