{ pkgs }:
pkgs.writeShellApplication {
  name = "gitops-render";

  runtimeInputs = [
    pkgs.coreutils
    pkgs.findutils
    pkgs.kubectl
  ];

  text = builtins.readFile ../scripts/gitops-render.sh;
}
