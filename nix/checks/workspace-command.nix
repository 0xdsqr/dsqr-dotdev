{
  lib,
  stdenvNoCC,
  nodejs_24,
  command,
  extraNativeBuildInputs ? [ ],
  name,
  nodeModules,
}:
let
  src = import ../lib/source.nix { inherit lib; };
in
stdenvNoCC.mkDerivation {
  inherit name src;

  nativeBuildInputs = [
    nodejs_24
  ]
  ++ extraNativeBuildInputs;

  dontConfigure = true;

  buildPhase = ''
    runHook preBuild

    export HOME="$TMPDIR/home"
    mkdir -p "$HOME"

    cp -R ${nodeModules}/. .
    find . -type d -name node_modules -exec chmod -R u+w {} +

    mkdir -p node_modules/@dsqr-dotdev
    rm -rf node_modules/dotdev
    rm -rf node_modules/studio
    rm -rf node_modules/@dsqr-dotdev/core
    rm -rf node_modules/@dsqr-dotdev/observability
    rm -rf node_modules/@dsqr-dotdev/api
    rm -rf node_modules/@dsqr-dotdev/database
    rm -rf node_modules/@dsqr-dotdev/react
    rm -rf node_modules/@dsqr-dotdev/tsconfig
    ln -sfn "$PWD/apps/dotdev" node_modules/dotdev
    ln -sfn "$PWD/apps/studio" node_modules/studio
    ln -sfn "$PWD/packages/api" node_modules/@dsqr-dotdev/api
    ln -sfn "$PWD/packages/database" node_modules/@dsqr-dotdev/database
    ln -sfn "$PWD/packages/react" node_modules/@dsqr-dotdev/react
    ln -sfn "$PWD/packages/typescript-config" node_modules/@dsqr-dotdev/tsconfig

    export PATH="$PWD/node_modules/.bin:$PATH"

    ${command}

    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall
    touch "$out"
    runHook postInstall
  '';
}
