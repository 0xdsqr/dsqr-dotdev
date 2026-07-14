{
  lib,
  stdenvNoCC,
  nodejs_24,
  nodeModules,
}:
import ./workspace-command.nix {
  inherit
    lib
    stdenvNoCC
    nodejs_24
    nodeModules
    ;
  name = "dsqr-dotdev-security-boundaries";
  command = ''
    npm run test:security
  '';
}
