{
  lib,
  stdenvNoCC,
  gitopsGenerateApplications,
  gitopsRender,
  kubectl,
  ripgrep,
  yq-go,
}:
let
  src = lib.fileset.toSource {
    root = ../..;
    fileset = lib.fileset.unions [
      ../../gitops
      ../../helm
      ../scripts/check-gitops.sh
    ];
  };
in
stdenvNoCC.mkDerivation {
  name = "dsqr-dotdev-gitops-check";
  inherit src;

  nativeBuildInputs = [
    gitopsGenerateApplications
    gitopsRender
    kubectl
    ripgrep
    yq-go
  ];

  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall

    bash ${../scripts/check-gitops.sh}

    mkdir -p "$out"
    touch "$out/gitops-check"

    runHook postInstall
  '';
}
