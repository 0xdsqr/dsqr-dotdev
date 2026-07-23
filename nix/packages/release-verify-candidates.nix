{ pkgs }:
pkgs.writeShellApplication {
  name = "release-verify-candidates";

  runtimeInputs = [
    pkgs.coreutils
    pkgs.gh
    pkgs.git
    pkgs.jq
    pkgs.skopeo
    pkgs.yq-go
  ];

  text = builtins.readFile ../scripts/release-verify-candidates.sh;
}
