{
  lib,
  buildNpmPackage,
  nodejs_24,
  nodejs-slim_24,
  makeWrapper,
  npmDeps,
}:
(buildNpmPackage.override { nodejs = nodejs_24; }) {
  pname = "dotdev-db-migrate";
  version = "0.0.0";
  src = lib.fileset.toSource {
    root = ../..;
    fileset = lib.fileset.unions [
      ../../package.json
      ../../package-lock.json
      ../../apps/dotdev/package.json
      ../../apps/labs/package.json
      ../../apps/studio/package.json
      ../../packages/api/package.json
      ../../packages/react/package.json
      ../../packages/database/package.json
      ../../packages/database/migrate
      ../../packages/database/migrations
    ];
  };
  inherit npmDeps;
  npmRebuildFlags = [ "--ignore-scripts" ];
  nativeBuildInputs = [ makeWrapper ];
  buildPhase = ''
    runHook preBuild
    node_modules/.bin/esbuild packages/database/migrate/production.ts \
      --bundle --platform=node --format=esm --target=node24 --external:pg-native \
      --banner:js='import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' \
      --outfile=production.mjs
    runHook postBuild
  '';
  installPhase = ''
    runHook preInstall
    mkdir -p "$out/share/db-migrate"
    cp production.mjs "$out/share/db-migrate/"
    cp -r packages/database/migrations "$out/share/db-migrate/migrations"
    makeWrapper ${nodejs-slim_24}/bin/node "$out/bin/db-migrate-knox" \
      --add-flags "$out/share/db-migrate/production.mjs"
    runHook postInstall
  '';
  meta.mainProgram = "db-migrate-knox";
}
