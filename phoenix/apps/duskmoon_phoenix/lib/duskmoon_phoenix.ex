defmodule DuskmoonPhoenix do
  @moduledoc """
  Provides Duskmoon UI for Phoenix project.

  Uses the Core design system with native HEEx components. React and
  Custom Elements integrations have separate JavaScript entry points.

  Requires `tailwindcss >= 4.0`

  ## Install in deps

  Add deps in `mix.exs`

      {:duskmoon_phoenix, "~> 11.0"}

  Install frontend packages:

      mix npm.install @duskmoon-dev/core @duskmoon-dev/elements

  ## Setup in `Phoenix` project

  - In `app_web.ex`

  ```elixir
      defp html_helpers do
        quote do
          # import all duskmoon ui component
          use DuskmoonPhoenix.Component
          # import all duskmoon ui art components
          use DuskmoonPhoenix.ArtComponent
          ...
        end
      end
  ```

  - In `app.css`

  ```css
      @source "../js/**/*.js";
      @source '../../lib/**/*.exs';
      @source '../../lib/**/*.ex';

      @import "tailwindcss";
      @plugin "@duskmoon-dev/core/plugin";
  ```

  """
end
