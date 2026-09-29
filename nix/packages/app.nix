{
  lib,
  buildNpmPackage,
  nodejs_24,
  nodejs-slim_24,
  makeWrapper,
  fetchNpmDeps,
  appName,
}:
let
  root = ../..;
  manifests = lib.fileset.unions [
    ../../package.json
    ../../package-lock.json
    ../../apps/dotdev/package.json
    ../../apps/labs/package.json
    ../../apps/studio/package.json
    ../../packages/api/package.json
    ../../packages/react/package.json
    ../../packages/database/package.json
  ];
  appRoot = root + "/apps/${appName}";
  # Source plus imported image assets (Vite fingerprints them at build time).
  sourceFiles =
    file:
    lib.any file.hasExt [
      "ts"
      "tsx"
      "css"
      "avif"
      "webp"
    ];
in
(buildNpmPackage.override { nodejs = nodejs_24; }) {
  pname = appName;
  npmBuildFlags = [ "--workspace=${appName}" ];
  version = "0.0.0";

  src = lib.fileset.toSource {
    inherit root;
    fileset = lib.fileset.unions [
      manifests
      ../../tsconfig.base.json
      (appRoot + "/tsconfig.json")
      (appRoot + "/vite.config.ts")
      ../../packages/api/tsconfig.json
      ../../packages/react/tsconfig.json
      (lib.fileset.fileFilter sourceFiles (appRoot + "/src"))
      (lib.fileset.fileFilter sourceFiles ../../packages/api/src)
      (lib.fileset.fileFilter sourceFiles ../../packages/react/src)
    ];
  };
  # A separate cached derivation internally; app edits do not refetch packages.
  npmDeps = fetchNpmDeps {
    name = "workspace-npm-deps";
    src = lib.fileset.toSource {
      inherit root;
      fileset = manifests;
    };
    hash = "sha256-yuVMjLVkqr/YPwuTBE7vs4XEFym2xV50SLeyF+GYS2M=";
  };
  npmRebuildFlags = [ "--ignore-scripts" ];
  env = {
    npm_config_audit = "false";
    npm_config_fund = "false";
  };
  nativeBuildInputs = [ makeWrapper ];

  # Pinned upstream builders embed local paths/times in generated manifests.
  # Normalize before bundling (and hashing chunks); fail loudly on API changes.
  preBuild = ''
    substituteInPlace node_modules/@tanstack/start-plugin-core/dist/esm/start-manifest-plugin/manifestBuilder.js \
      --replace-fail 'return serialize(startManifest);' \
        'return serialize(startManifest).split(process.cwd()).join(".");'
    substituteInPlace node_modules/nitro/dist/_build/common.mjs \
      --replace-fail 'mtime: stat.mtime.toJSON(),' \
        'mtime: new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toJSON(),' \
      --replace-fail 'JSON.stringify(assets, null, 2)' \
        'JSON.stringify(Object.fromEntries(Object.keys(assets).sort().map(key => [key, assets[key]])), null, 2)'
    substituteInPlace node_modules/nitro/dist/_chunks/nitro3.mjs \
      --replace-fail 'hash(h.handler)' 'hash(h.handler.replace(process.env.NIX_BUILD_TOP, "."))'
  '';

  postBuild = ''
    npm run typecheck --workspace ${appName} --workspace @dsqr-dotdev/api --workspace @dsqr-dotdev/react
  '';

  installPhase = ''
    runHook preInstall
    mkdir -p "$out/share/${appName}"
    # Nitro's metadata contains a wall-clock timestamp; only ship runtime files.
    cp -r apps/${appName}/.output/server apps/${appName}/.output/public "$out/share/${appName}/"
    makeWrapper ${nodejs-slim_24}/bin/node "$out/bin/${appName}" \
      --add-flags "$out/share/${appName}/server/index.mjs" \
      --set NODE_ENV production
    runHook postInstall
  '';

  meta.mainProgram = appName;
}
