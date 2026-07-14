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
  name = "dsqr-dotdev-infra-smoke";
  command = ''
    npm run test:infra-security
    npm run haven -- outputs >/dev/null
  '';
})
