{
  lib,
  buildNpmPackage,
  nodejs_26,
  nodejs-slim_26,
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
  sourceFiles =
    file:
    lib.any file.hasExt [
      "ts"
      "tsx"
      "css"
      "avif"
      "webp"
      "svg"
      "png"
    ];
in
(buildNpmPackage.override { nodejs = nodejs_26; }) {
  pname = appName;
  npmBuildFlags = [ "--workspace=${appName}" ];
  version = "0.0.0";

  src = lib.fileset.toSource {
    inherit root;
    fileset = lib.fileset.unions [
      manifests
      (appRoot + "/tsconfig.json")
      (appRoot + "/vite.config.ts")
      ../../packages/api/tsconfig.json
      ../../packages/react/tsconfig.json
      ../../packages/database/tsconfig.json
      ../../packages/database/drizzle.config.ts
      (lib.fileset.fileFilter sourceFiles (appRoot + "/src"))
      # Fixed-URL files (robots.txt, sitemap, manifest); optional per app.
      (lib.fileset.maybeMissing (appRoot + "/public"))
      (lib.fileset.fileFilter sourceFiles ../../packages/api/src)
      (lib.fileset.fileFilter sourceFiles ../../packages/react/src)
      (lib.fileset.fileFilter sourceFiles ../../packages/database/src)
    ];
  };
  npmDeps = fetchNpmDeps {
    name = "workspace-npm-deps";
    src = lib.fileset.toSource {
      inherit root;
      fileset = manifests;
    };
    hash = "sha256-nsq86gr9Ky+eIo5Fq2/+2/rJBmgfPRprH/ixBgb1tC0=";
  };
  npmRebuildFlags = [ "--ignore-scripts" ];
  env = {
    npm_config_audit = "false";
    npm_config_fund = "false";
  };
  nativeBuildInputs = [ makeWrapper ];

  preBuild = ''
    substituteInPlace node_modules/@tanstack/start-plugin-core/dist/esm/start-manifest-plugin/manifestBuilder.js \
      --replace-fail 'return serialize(startManifest);' \
        'return serialize(startManifest).split(process.cwd()).join(".");'
    substituteInPlace node_modules/nitro/dist/_build/common.mjs \
      --replace-fail 'mtime: stat.mtime.toJSON(),' \
        'mtime: new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toJSON(),' \
      --replace-fail 'JSON.stringify(assets, null, 2)' \
        'JSON.stringify(Object.fromEntries(Object.keys(assets).sort().map(key => [key, assets[key]])), null, 2)'
    # Route handler ids hash absolute paths; hash them relative to the build directory.
    substituteInPlace node_modules/nitro/dist/_chunks/nitro.mjs \
      --replace-fail 'hash(handler)' 'hash(handler.replace(process.env.NIX_BUILD_TOP, "."))'
  '';

  postBuild = ''
    npm run typecheck --workspace ${appName} --workspace @dsqr-dotdev/api --workspace @dsqr-dotdev/react
    node --input-type=module < ${../checks/proxy-policy.mjs}
  '';

  installPhase = ''
    runHook preInstall
    mkdir -p "$out/share/${appName}"
    cp -r apps/${appName}/.output/server apps/${appName}/.output/public "$out/share/${appName}/"
    makeWrapper ${nodejs-slim_26}/bin/node "$out/bin/${appName}" \
      --add-flags "$out/share/${appName}/server/index.mjs" \
      --set NODE_ENV production
    runHook postInstall
  '';

  meta.mainProgram = appName;
}
