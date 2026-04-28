{
  lib,
  stdenvNoCC,
  nodejs_24,
  nodeModules,
}:
import ./workspace-command.nix ({
  inherit
    lib
    stdenvNoCC
    nodejs_24
    nodeModules
    ;
  name = "dsqr-dotdev-typecheck";
  command = ''
    npm run typecheck
  '';
})
