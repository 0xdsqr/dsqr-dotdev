{ pkgs }:
pkgs.writeShellApplication {
  name = "release-publish-charts";

  runtimeInputs = [
    pkgs.git
    pkgs.kubernetes-helm
    pkgs.yq-go
  ];

  text = builtins.readFile ../scripts/release-publish-charts.sh;
}
