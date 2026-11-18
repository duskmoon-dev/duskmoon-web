const elementReference = /@duskmoon-dev\/(?:el-[\w-]+|elements|art-elements)(?![\w-])|(?:^|[."'\/\\])packages[/\\]elements(?:[/\\]|$)/;

export function assertNoElementReference(value, source) {
  const match = elementReference.exec(value);
  if (match) throw new Error(`Duskmoon Elements dependency in ${source}: ${match[0]}`);
}

export function assertNativeReactBuild(result) {
  if (!result.success) throw new Error("React build failed");
  if (!result.metafile) throw new Error("Missing React build input metadata");
  for (const [input, metadata] of Object.entries(result.metafile.inputs)) {
    assertNoElementReference(input, "React build input");
    if (/(?:^|[/\\])node_modules[/\\]react(?:-dom)?[/\\]/.test(input)) {
      throw new Error(`React peer bundled from ${input}`);
    }
    for (const specifier of metadata.imports ?? []) assertNoElementReference(specifier.path, input);
  }
  for (const metadata of Object.values(result.metafile.outputs)) {
    for (const specifier of metadata.imports ?? []) {
      assertNoElementReference(specifier.path, "React emitted import");
    }
  }
}
