{
  lib,
  stdenvNoCC,
  nodejs_24,
  oxlint,
  nodeModules,
}:
import ./workspace-command.nix ({
  inherit
    lib
    stdenvNoCC
    nodejs_24
    nodeModules
    ;
  extraNativeBuildInputs = [ oxlint ];
  name = "dsqr-dotdev-lint";
  command = ''
    npm run lint
  '';
})
