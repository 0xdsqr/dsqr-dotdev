{
  lib,
  stdenvNoCC,
  nodejs_24,
}:
stdenvNoCC.mkDerivation {
  name = "dsqr-dotdev-release-versioning-check";
  src = lib.fileset.toSource {
    root = ../..;
    fileset = lib.fileset.unions [
      ../../.changeset
      ../../package.json
      ../scripts/check-release-versions.mjs
      (lib.fileset.fileFilter (
        file: file.name == "package.json" || file.name == "CHANGELOG.md"
      ) ../../apps)
      (lib.fileset.fileFilter (
        file: file.name == "package.json" || file.name == "CHANGELOG.md"
      ) ../../packages)
      (lib.fileset.fileFilter (file: file.name == "Chart.yaml") ../../helm)
    ];
  };

  nativeBuildInputs = [ nodejs_24 ];
  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall
    node nix/scripts/check-release-versions.mjs
    mkdir -p "$out"
    touch "$out/release-versioning-check"
    runHook postInstall
  '';
}
