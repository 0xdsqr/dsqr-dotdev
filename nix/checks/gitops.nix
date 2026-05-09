{
  lib,
  stdenvNoCC,
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

  nativeBuildInputs = [ kubectl ];

  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall

    kubectl kustomize gitops/bootstrap >/dev/null
    kubectl kustomize gitops/clusters/homelab >/dev/null

    mkdir -p "$out"
    touch "$out/gitops-check"

    runHook postInstall
  '';
}
