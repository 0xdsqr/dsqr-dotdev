{
  lib,
  nodejs_24,
  stdenvNoCC,
}:
stdenvNoCC.mkDerivation {
  name = "dsqr-dotdev-dependency-policy";
  src = lib.fileset.toSource {
    root = ../..;
    fileset = lib.fileset.unions [
      ../../package.json
      ../../package-lock.json
      ../scripts/check-dependency-policy.mjs
      (lib.fileset.fileFilter (file: file.name == "package.json") ../../apps)
      (lib.fileset.fileFilter (file: file.name == "package.json") ../../packages)
    ];
  };

  nativeBuildInputs = [ nodejs_24 ];
  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall
    node nix/scripts/check-dependency-policy.mjs
    touch "$out"
    runHook postInstall
  '';
}
