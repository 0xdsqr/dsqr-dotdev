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
  appName = "labs";
  port = 3022;
  sourcePaths = [
    ../../package.json
    ../../apps/labs
    ../../packages/api
    ../../packages/database
    ../../packages/observability
    ../../packages/react
    ../../packages/typescript-config
  ];
})
