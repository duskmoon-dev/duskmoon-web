defmodule NativeConsumer.MixProject do
  use Mix.Project

  def project do
    [
      app: :native_consumer,
      version: "0.0.0",
      deps: [
        {:duskmoon_phoenix, path: "hex-package"},
        {:bandit, "~> 1.0"},
        {:plug, "~> 1.20"}
      ]
    ]
  end
end
