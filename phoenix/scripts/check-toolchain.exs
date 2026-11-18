Code.require_file("native-policy.exs", __DIR__)
Code.require_file("toolchain-lock.exs", __DIR__)
DuskmoonUI.NativePolicy.validate!()
root = Path.expand("..", __DIR__)
version = DuskmoonUI.ToolchainLock.bundler_version!(Path.join(root, "mix.lock"))

for app <- DuskmoonUI.ToolchainLock.cohort() do
  if File.exists?(Path.join([root, "apps", app, "mix.exs"])),
    do: raise("Toolchain source remains in UI umbrella: #{app}")
end

IO.puts(
  "UI toolchain: all #{length(DuskmoonUI.ToolchainLock.cohort())} packages locked to Hex #{version}; strict precompiled policy"
)
