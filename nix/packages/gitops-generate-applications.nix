{ pkgs }:
pkgs.writeShellApplication {
  name = "gitops-generate-applications";

  runtimeInputs = [
    pkgs.coreutils
    pkgs.diffutils
    pkgs.findutils
    pkgs.gettext
    pkgs.gnugrep
    pkgs.yq-go
  ];

  text = builtins.readFile ../scripts/gitops-generate-applications.sh;
}
