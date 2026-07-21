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
      ../../apps/dotdev/package.json
      ../../apps/labs/package.json
      ../../apps/studio/package.json
      ../../helm
      ../../gitops/values/dotdev-web
      ../../gitops/values/dotdev-studio
      ../../gitops/values/dotdev-labs
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
          defaultRendered="$TMPDIR/$chartName-default.yaml"

          case "$chartName" in
            dotdev-web)
              packageFile="apps/dotdev/package.json"
              ;;
            dotdev-studio)
              packageFile="apps/studio/package.json"
              ;;
            dotdev-labs)
              packageFile="apps/labs/package.json"
              ;;
          esac

          packageVersion="$(yq eval -r '.version' "$packageFile")"
          chartVersion="$(yq eval -r '.version' "$chart/Chart.yaml")"
          appVersion="$(yq eval -r '.appVersion' "$chart/Chart.yaml")"
          if [ "$appVersion" != "$packageVersion" ]; then
            echo "$chartName appVersion $appVersion must match $packageFile version $packageVersion" >&2
            exit 1
          fi
          if [ "$chartVersion" != "$packageVersion" ]; then
            echo "$chartName version $chartVersion must match $packageFile version $packageVersion" >&2
            exit 1
          fi
          if ! printf '%s\n' "$chartVersion" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+([+-][0-9A-Za-z.-]+)?$'; then
            echo "$chartName chart version $chartVersion is not SemVer" >&2
            exit 1
          fi

          helm template "$chartName" "$chart" --namespace default >"$defaultRendered"
          helm template "$(basename "$chart")" "$chart" \
            --namespace default \
            -f "$chart/values-prod.yaml" \
            -f "gitops/values/$(basename "$chart")/hub-a.yaml" \
            >"$rendered"

          deployment='select(.kind == "Deployment")'
          defaultImage="$(yq eval "$deployment | .spec.template.spec.containers[0].image" "$defaultRendered")"
          case "$defaultImage" in
            *":$appVersion") ;;
            *)
              echo "$chartName default image must use Chart.appVersion $appVersion, got $defaultImage" >&2
              exit 1
              ;;
          esac

          productionImage="$(yq eval "$deployment | .spec.template.spec.containers[0].image" "$rendered")"
          if ! printf '%s\n' "$productionImage" | grep -Eq '@sha256:[0-9a-f]{64}$'; then
            echo "$chartName production image must use an immutable sha256 digest, got $productionImage" >&2
            exit 1
          fi
          assertRenderedValue "$rendered" \
            "$deployment | .spec.template.spec.containers[0].imagePullPolicy" IfNotPresent
          assertRenderedValue "$rendered" \
            "$deployment | .metadata.labels.\"app.kubernetes.io/version\"" "$packageVersion"
          assertRenderedValue "$rendered" \
            "$deployment | .spec.template.metadata.labels.\"app.kubernetes.io/version\"" "$packageVersion"

          if helm template "$chartName" "$chart" --namespace default \
            -f "$chart/values-prod.yaml" --set-string image.digest= >/dev/null 2>&1; then
            echo "$chartName production values must reject a missing digest" >&2
            exit 1
          fi
          if helm template "$chartName" "$chart" --namespace default \
            --set-string image.tag=latest >/dev/null 2>&1; then
            echo "$chartName must reject the mutable latest tag" >&2
            exit 1
          fi

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
