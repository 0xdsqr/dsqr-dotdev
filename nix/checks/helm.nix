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
      ../../gitops/manifests/dotdev-web
      ../../gitops/manifests/dotdev-studio
      ../../gitops/manifests/dotdev-labs
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

      case "$(basename "$chart")" in
        dotdev-web|dotdev-studio|dotdev-labs)
          helm template "$(basename "$chart")" "$chart" \
            --namespace default \
            -f "gitops/manifests/$(basename "$chart")/base/values-common.yaml" \
            -f "gitops/manifests/$(basename "$chart")/overlays/homelab/values-overrides.yaml" \
            >/dev/null
          ;;
        *)
          helm template "$(basename "$chart")" "$chart" --namespace default >/dev/null
          ;;
      esac
    done

    mkdir -p "$out"
    touch "$out/helm-check"

    runHook postInstall
  '';
}
