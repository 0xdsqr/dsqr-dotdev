{ pkgs }:
pkgs.writeShellApplication {
  name = "release-publish-images";

  runtimeInputs = [
    pkgs.git
    pkgs.jq
    pkgs.skopeo
    pkgs.yq-go
  ];

  text = builtins.readFile ../scripts/release-publish-images.sh;
}
