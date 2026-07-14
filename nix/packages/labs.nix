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
})
