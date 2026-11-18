defmodule DuskmoonPhoenix.ArtComponent do
  @moduledoc """
  Duskmoon Art Components

  Decorative and animated visual effects powered by `@duskmoon-dev/art-elements`
  custom elements and `@duskmoon-dev/css-art`.

  ## Example

      defp html_helpers do
        quote do
          use DuskmoonPhoenix.Component  # includes art components
          ...
        end
      end

  Or import art components separately:

      use DuskmoonPhoenix.ArtComponent

  """

  @doc false
  def art_component do
    quote do
      import DuskmoonPhoenix.ArtComponent.Atom
      import DuskmoonPhoenix.ArtComponent.CatStargazer
      import DuskmoonPhoenix.ArtComponent.GeminiInput
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
  defmacro __using__(_) do
    quote do
      unquote(art_component())
    end
  end
end
