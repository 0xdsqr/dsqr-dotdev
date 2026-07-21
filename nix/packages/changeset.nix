{ pkgs, nodeModules }:
pkgs.writeShellApplication {
  name = "changeset";
  runtimeInputs = [ pkgs.nodejs_24 ];
  text = ''
    exec ${nodeModules}/node_modules/.bin/changeset "$@"
  '';
}
