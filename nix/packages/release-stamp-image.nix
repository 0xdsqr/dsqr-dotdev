{ pkgs }:
pkgs.writeShellApplication {
  name = "release-stamp-image";

  runtimeInputs = [
    pkgs.coreutils
    pkgs.yq-go
  ];

  text = builtins.readFile ../scripts/release-stamp-image.sh;
}
