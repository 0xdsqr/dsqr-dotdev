{
  pkgs,
  changeset,
  gitopsReleaseImage,
  registriesConf,
}:
pkgs.writeShellApplication {
  name = "release-prepare";

  runtimeEnv.CONTAINERS_REGISTRIES_CONF = registriesConf;

  runtimeInputs = [
    changeset
    gitopsReleaseImage
    pkgs.coreutils
    pkgs.docker-client
    pkgs.git
    pkgs.grype
    pkgs.jq
    pkgs.nodejs_24
    pkgs.skopeo
    pkgs.syft
  ];

  text = builtins.readFile ../scripts/release-prepare.sh;
}
