{
  lib,
  stdenvNoCC,
  kubernetes-helm,
  yq-go,
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

  nativeBuildInputs = [
    kubernetes-helm
    yq-go
  ];

  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall

    assertRenderedValue() {
      rendered="$1"
      expression="$2"
      expected="$3"
      actual="$(yq eval "$expression" "$rendered")"

      if [ "$actual" != "$expected" ]; then
        echo "expected $expression to render as $expected, got $actual" >&2
        return 1
      fi
    }

    for chart in helm/*; do
      [ -d "$chart" ] || continue
      helm lint "$chart"

      case "$(basename "$chart")" in
        dotdev-web|dotdev-studio|dotdev-labs)
          chartName="$(basename "$chart")"
          rendered="$TMPDIR/$chartName.yaml"
          helm template "$(basename "$chart")" "$chart" \
            --namespace default \
            -f "$chart/values-prod.yaml" \
            -f "gitops/manifests/$(basename "$chart")/overlays/hub-a/values-overrides.yaml" \
            >"$rendered"

          deployment='select(.kind == "Deployment")'
          assertRenderedValue "$rendered" \
            "$deployment | .spec.template.spec.automountServiceAccountToken" false
          assertRenderedValue "$rendered" \
            "$deployment | .spec.template.spec.enableServiceLinks" false
          assertRenderedValue "$rendered" \
            "$deployment | .spec.template.spec.securityContext.runAsNonRoot" true
          assertRenderedValue "$rendered" \
            "$deployment | .spec.template.spec.securityContext.runAsUser" 65534
          assertRenderedValue "$rendered" \
            "$deployment | .spec.template.spec.securityContext.seccompProfile.type" RuntimeDefault
          assertRenderedValue "$rendered" \
            "$deployment | .spec.template.spec.containers[0].securityContext.allowPrivilegeEscalation" false
          assertRenderedValue "$rendered" \
            "$deployment | .spec.template.spec.containers[0].securityContext.capabilities.drop[0]" ALL
          assertRenderedValue "$rendered" \
            "$deployment | .spec.template.spec.containers[0].securityContext.readOnlyRootFilesystem" true
          assertRenderedValue "$rendered" \
            "$deployment | .spec.template.spec.containers[0].securityContext.runAsNonRoot" true
          assertRenderedValue "$rendered" \
            "$deployment | .spec.template.spec.containers[0].volumeMounts[] | select(.mountPath == \"/tmp\") | .name" tmp
          assertRenderedValue "$rendered" \
            "$deployment | .spec.template.spec.volumes[] | select(.name == \"tmp\") | .emptyDir.sizeLimit" 64Mi
          assertRenderedValue "$rendered" \
            "$deployment | (.spec.template.metadata.annotations.\"checksum/config\" | length > 0)" true

          case "$chartName" in
            dotdev-web)
              assertRenderedValue "$rendered" \
                "$deployment | .spec.template.spec.containers[0].envFrom[] | select(has(\"secretRef\")) | .secretRef.name" dotdev-web-secrets
              ;;
            dotdev-studio)
              assertRenderedValue "$rendered" \
                "$deployment | .spec.template.spec.containers[0].envFrom[] | select(has(\"secretRef\")) | .secretRef.name" dotdev-studio-secrets
              ;;
            dotdev-labs)
              if yq eval "$deployment | .spec.template.spec.containers[0].envFrom[] | select(has(\"secretRef\"))" "$rendered" | grep . >/dev/null; then
                echo "dotdev-labs must not receive an application secret" >&2
                exit 1
              fi
              ;;
          esac

          networkPolicy='select(.kind == "NetworkPolicy")'
          yq eval "$networkPolicy | .spec.policyTypes[]" "$rendered" | grep -Fx Egress >/dev/null
          requiredPorts="53 4318"
          case "$chartName" in
            dotdev-web|dotdev-studio)
              requiredPorts="$requiredPorts 443 5432"
              ;;
          esac
          for port in $requiredPorts; do
            yq eval "$networkPolicy | .spec.egress[].ports[]?.port" "$rendered" | grep -Fx "$port" >/dev/null
          done
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
