{
  lib,
  stdenvNoCC,
  nodejs_24,
  nodejs-slim_24,
  nodeModules,
}:
import ./app.nix ({
  inherit
    lib
    stdenvNoCC
    nodejs_24
    nodejs-slim_24
    nodeModules
    ;
  appName = "studio";
  port = 3021;
  preBuildCommands = ''
    npm run build:database
    npm run build:api
  '';
  runtimeDependencies = [ "pg" ];
  sourcePaths = [
    ../../package.json
    ../../apps/studio
    ../../packages/api
    ../../packages/database
    ../../packages/observability
    ../../packages/react
    ../../packages/typescript-config
  ];
})
