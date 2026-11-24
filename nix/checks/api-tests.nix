{
  lib,
  buildNpmPackage,
  nodejs_26,
  npmDeps,
}:
(buildNpmPackage.override { nodejs = nodejs_26; }) {
  pname = "api-tests";
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
      ../../packages/api/tsconfig.json
      ../../packages/api/src
      ../../packages/api/test
      ../../packages/react/package.json
      ../../packages/database/package.json
      ../../packages/database/src
    ];
  };
  inherit npmDeps;
  npmRebuildFlags = [ "--ignore-scripts" ];
  dontNpmBuild = true;
  # Unit and in-memory HttpApi tests: no network, database or secrets.
  doCheck = true;
  checkPhase = ''
    runHook preCheck
    npm test --workspace @dsqr-dotdev/api
    runHook postCheck
  '';
  installPhase = ''touch "$out"'';
}
