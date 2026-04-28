{
  buildNpmPackage,
  lib,
  nodejs_24,
  npmDepsHash,
}:
let
  src = import ../lib/manifest-source.nix { inherit lib; };
in
(buildNpmPackage.override { nodejs = nodejs_24; }) {
  pname = "dsqr-dotdev-node-modules";
  version = "0.0.0";
  inherit src npmDepsHash;

  npmDepsFetcherVersion = 2;
  npmInstallFlags = [
    "--ignore-scripts"
    "--no-audit"
    "--no-fund"
    "--loglevel=warn"
  ];

  dontNpmBuild = true;

  installPhase = ''
    runHook preInstall
    mkdir -p "$out"
    cp package.json package-lock.json "$out/"
    cp -R node_modules "$out/node_modules"
    find . -mindepth 2 -maxdepth 3 -type d -name node_modules -exec cp -R --parents {} "$out/" \;
    rm -f "$out/node_modules/dotdev"
    rm -f "$out/node_modules/studio"
    rm -f "$out/node_modules/@dsqr-dotdev/"*
    runHook postInstall
  '';

  meta.platforms = [
    "aarch64-darwin"
    "x86_64-linux"
  ];
}
