#!/bin/sh
# Run outside both workspaces with independent dependency/build/native cache state.
set -eu
web_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cold_root=${DUSKMOON_COLD_UI_ROOT:-$(mktemp -d "${TMPDIR:-/tmp}/duskmoon-cold-ui.XXXXXX")}
[ -z "$(ls -A "$cold_root")" ] || { echo 'Cold output must be empty' >&2; exit 2; }
git -C "$web_root" archive HEAD | tar -x -C "$cold_root"
cd "$cold_root"
bun install --frozen-lockfile
bun run build:packages
cd phoenix
export RUSTLER_PRECOMPILED_GLOBAL_CACHE_PATH="$cold_root/native-cache/rust"
export ZIGLER_PRECOMPILED_GLOBAL_CACHE_PATH="$cold_root/native-cache/zig"
export DUSKMOON_NATIVE_INVOCATION_LOG="$cold_root/native-invocations.log"
export MIX_ENV=test
# A disposable Storybook HEEx class change must be picked up by source scanning.
elixir -e '
  file = "apps/duskmoon_storybook/storybook/action/button.story.exs"
  source = File.read!(file)
  updated = String.replace(source, "attributes: %{variant: color}", ~s(attributes: %{variant: color, class: "p-[37px]"}), global: false)
  if source == updated, do: raise("Representative HEEx probe must be reviewed")
  File.write!(file, updated)
'

mix deps.get --check-locked
elixir scripts/check-toolchain.exs
scripts/with-precompiled-toolchain.sh sh -c 'mix compile --warnings-as-errors && mix test && bun test --cwd apps/duskmoon_phoenix && mix prepublish && mix storybook.assets'
rg -F '.p-\[37px\]' apps/duskmoon_storybook/priv/static/assets/css/app.css >/dev/null
test ! -s "$DUSKMOON_NATIVE_INVOCATION_LOG" || {
  if rg 'duskmoon_(oxc|oxide|vize|quickbeam)' "$DUSKMOON_NATIVE_INVOCATION_LOG"; then
    echo 'Duskmoon native compiler invoked during cold UI build' >&2; exit 1
  fi
}
printf 'Cold UI evidence: %s\n' "$cold_root"
