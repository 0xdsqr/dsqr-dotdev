{
  pkgs,
  changeset,
  gitopsReleaseImage,
}:
pkgs.writeShellApplication {
  name = "release-prepare";

  runtimeInputs = [
    changeset
    gitopsReleaseImage
    pkgs.coreutils
    pkgs.docker-client
    pkgs.git
    pkgs.jq
    pkgs.nodejs_24
  ];

  text = builtins.readFile ../scripts/release-prepare.sh;
}
