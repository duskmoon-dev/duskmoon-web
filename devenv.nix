{ pkgs, lib, inputs, ... }:

let
  stable = import inputs.nixpkgs-stable { system = pkgs.stdenv.system; };
in
{
  env.DUSKMOON_NATIVE_MODE = "precompiled";
  languages.elixir.enable = true;
  languages.elixir.package = stable.beam28Packages.elixir;
  languages.javascript.enable = true;
  languages.javascript.package = stable.nodejs_24;
  languages.javascript.bun.enable = true;
  languages.javascript.bun.package = stable.bun;

  packages = with stable; [ git git-lfs jq curl watchman ] ++
    lib.optionals stdenv.isLinux [ inotify-tools ];
}
