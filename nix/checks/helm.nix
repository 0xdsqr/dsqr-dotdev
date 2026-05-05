{
  lib,
  stdenvNoCC,
  kubernetes-helm,
}:
stdenvNoCC.mkDerivation {
  name = "dsqr-dotdev-helm-check";
  src = lib.fileset.toSource {
    root = ../..;
    fileset = lib.fileset.unions [
      ../../helm
    ];
  };

  nativeBuildInputs = [ kubernetes-helm ];

  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall

    for chart in helm/*; do
      [ -d "$chart" ] || continue
      helm lint "$chart"

      if [ -f "$chart/values-prod.yaml" ]; then
        helm template "$(basename "$chart")" "$chart" --namespace default -f "$chart/values-prod.yaml" >/dev/null
      else
        helm template "$(basename "$chart")" "$chart" --namespace default >/dev/null
      fi
    done

    mkdir -p "$out"
    touch "$out/helm-check"

    runHook postInstall
  '';
}
