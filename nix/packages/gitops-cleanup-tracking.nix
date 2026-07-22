{ pkgs }:
pkgs.writeShellApplication {
  name = "gitops-cleanup-tracking";

  runtimeInputs = [
    pkgs.coreutils
    pkgs.kubernetes-helm
    pkgs.jq
    pkgs.kubectl
    pkgs.yq-go
  ];

  text = builtins.readFile ../scripts/gitops-cleanup-tracking.sh;
}
