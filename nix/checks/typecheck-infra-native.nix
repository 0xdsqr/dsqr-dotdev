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
  name = "dsqr-dotdev-infra-native-typecheck";
  command = ''
    npm run typecheck:infra:native
  '';
})
