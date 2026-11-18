defmodule DuskmoonUI.ToolchainLock do
  @moduledoc false
  @cohort ~w(duskmoon_bundler duskmoon_bundler_runtime duskmoon_oxc duskmoon_oxide duskmoon_vize duskmoon_quickbeam duskmoon_npm duskmoon_hex_solver duskmoon_hologram)
  def cohort, do: @cohort

  def stable!(value) do
    unless value =~ ~r/^\d+\.\d+\.\d+$/,
      do: raise("expected stable numeric version, got #{inspect(value)}")

    Version.parse!(value)
    value
  end

  @doc "Returns the synchronized stable 10.x Bundler version recorded in the lockfile."
  def bundler_version!(lockfile \\ "mix.lock") do
    lockfile |> bundler_lock!() |> Map.fetch!(:duskmoon_bundler) |> elem(2)
  end

  @doc "Returns verified Hex lock entries for the Bundler cohort or a consumer subset."
  def bundler_lock!(lockfile \\ "mix.lock", packages \\ @cohort) do
    {lock, _} =
      lockfile
      |> File.read!()
      |> Code.string_to_quoted!(file: lockfile, emit_warnings: false)
      |> Code.eval_quoted()

    entries =
      Map.new(packages, fn name ->
        package = String.to_atom(name)

        case Map.get(lock, package) do
          {:hex, ^package, version, checksum, _managers, _deps, "hexpm", outer_checksum} = entry ->
            stable!(version)

            unless Version.match?(version, "~> 10.0"),
              do: raise("#{name} locked version #{version} does not satisfy ~> 10.0")

            for value <- [checksum, outer_checksum] do
              unless is_binary(value) and value =~ ~r/^[a-f0-9]{64}$/,
                do: raise("#{name} requires both Hex lock checksums")
            end

            {package, entry}

          other ->
            raise("#{name} requires a matching hexpm lock entry, got #{inspect(other)}")
        end
      end)

    versions = entries |> Map.values() |> Enum.map(&elem(&1, 2)) |> Enum.uniq()

    unless length(versions) == 1,
      do: raise("Bundler cohort versions differ: #{inspect(versions)}")

    entries
  end
end
