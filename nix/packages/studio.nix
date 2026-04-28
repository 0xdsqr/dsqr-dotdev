{
  lib,
  stdenvNoCC,
  nodejs_24,
  nodeModules,
}:
import ./app.nix ({
  inherit
    lib
    stdenvNoCC
    nodejs_24
    nodeModules
    ;
  appName = "studio";
  port = 3021;
})
