{ pkgs }:
pkgs.writeShellApplication {
  name = "gitops-release-image";

  runtimeInputs = [
    pkgs.coreutils
    pkgs.yq-go
  ];

  text = builtins.readFile ../scripts/gitops-release-image.sh;
}
