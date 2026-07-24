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
  workspaceLinks = import ../lib/workspace-links.nix;
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
    find . -type d -path '*/node_modules*' -exec chmod u+w {} +

    ${workspaceLinks.linkWorkspacePackages}

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
