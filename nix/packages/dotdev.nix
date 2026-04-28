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
  appName = "dotdev";
  port = 3020;
})
