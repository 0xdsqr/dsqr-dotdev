{
  lib,
  stdenvNoCC,
  gitopsGenerateApplications,
  kubectl,
}:
let
  src = lib.fileset.toSource {
    root = ../..;
    fileset = lib.fileset.unions [
      ../../gitops
    ];
  };
in
stdenvNoCC.mkDerivation {
  name = "dsqr-dotdev-gitops-check";
  inherit src;

  nativeBuildInputs = [
    gitopsGenerateApplications
    kubectl
  ];

  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall

    gitops-generate-applications --check
    kubectl kustomize gitops/clusters/homelab/bootstrap >/dev/null
    kubectl kustomize gitops/clusters/homelab/applications >/dev/null

    mkdir -p "$out"
    touch "$out/gitops-check"

    runHook postInstall
  '';
}
