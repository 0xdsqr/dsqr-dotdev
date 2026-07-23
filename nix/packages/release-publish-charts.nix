{ pkgs }:
pkgs.writeShellApplication {
  name = "release-publish-charts";

  runtimeInputs = [
    pkgs.coreutils
    pkgs.diffutils
    pkgs.git
    pkgs.gnutar
    pkgs.gzip
    pkgs.kubernetes-helm
    pkgs.yq-go
  ];

  text = builtins.readFile ../scripts/release-publish-charts.sh;
}
