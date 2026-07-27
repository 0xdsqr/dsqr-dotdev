{
  kubernetes-helm,
  lib,
  stdenvNoCC,
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
      chartName="$(basename "$chart")"
      productionValues="$chart/values-prod.yaml"
      rendered="$TMPDIR/$chartName-production.yaml"

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
        *)
          echo "unexpected chart $chartName" >&2
          exit 1
          ;;
      esac

      packageVersion="$(yq eval -r '.version' "$packageFile")"
      chartVersion="$(yq eval -r '.version' "$chart/Chart.yaml")"
      appVersion="$(yq eval -r '.appVersion' "$chart/Chart.yaml")"
      imageVersion="$(yq eval -r '.image.version' "$productionValues")"
      imageDigest="$(yq eval -r '.image.digest' "$productionValues")"

      if [ "$chartVersion" != "$packageVersion" ] ||
        [ "$appVersion" != "$packageVersion" ] ||
        [ "$imageVersion" != "$packageVersion" ]; then
        echo "$chartName package, chart, app, and production image versions must agree" >&2
        exit 1
      fi
      if ! printf '%s\n' "$chartVersion" |
        grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+([+-][0-9A-Za-z.-]+)?$'; then
        echo "$chartName chart version $chartVersion is not SemVer" >&2
        exit 1
      fi
      if ! printf '%s\n' "$imageDigest" | grep -Eq '^sha256:[0-9a-f]{64}$'; then
        echo "$chartName production image must pin an immutable sha256 digest" >&2
        exit 1
      fi

      helm lint "$chart" -f "$productionValues"
      helm template "$chartName" "$chart" \
        --namespace dsqr \
        -f "$productionValues" >"$rendered"

      deployment='select(.kind == "Deployment")'
      productionImage="$(yq eval "$deployment | .spec.template.spec.containers[0].image" "$rendered")"
      if [ "$productionImage" != "$(yq eval -r '.image.repository' "$productionValues")@$imageDigest" ]; then
        echo "$chartName rendered unexpected production image $productionImage" >&2
        exit 1
      fi

      assertRenderedValue "$rendered" \
        "$deployment | .spec.template.spec.containers[0].imagePullPolicy" IfNotPresent
      assertRenderedValue "$rendered" \
        "$deployment | .metadata.labels.\"app.kubernetes.io/version\"" "$packageVersion"
      assertRenderedValue "$rendered" \
        "$deployment | .spec.template.metadata.labels.\"app.kubernetes.io/version\"" "$packageVersion"
      assertRenderedValue "$rendered" \
        "$deployment | .spec.template.spec.automountServiceAccountToken" false
      assertRenderedValue "$rendered" \
        "$deployment | .spec.template.spec.enableServiceLinks" false
      assertRenderedValue "$rendered" \
        "$deployment | .spec.template.spec.securityContext.runAsNonRoot" true
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

      if helm template "$chartName" "$chart" --namespace dsqr \
        -f "$productionValues" --set-string image.digest= >/dev/null 2>&1; then
        echo "$chartName production values must reject a missing digest" >&2
        exit 1
      fi
      if helm template "$chartName" "$chart" --namespace dsqr \
        --set-string image.tag=latest >/dev/null 2>&1; then
        echo "$chartName must reject the mutable latest tag" >&2
        exit 1
      fi

      networkPolicy='select(.kind == "NetworkPolicy")'
      yq eval "$networkPolicy | .spec.policyTypes[]" "$rendered" | grep -Fx Egress >/dev/null
      requiredPorts="53 4318"
      case "$chartName" in
        dotdev-web|dotdev-studio)
          requiredPorts="$requiredPorts 443 5432"
          ;;
      esac
      for port in $requiredPorts; do
        yq eval "$networkPolicy | .spec.egress[].ports[]?.port" "$rendered" |
          grep -Fx "$port" >/dev/null
      done
    done

    mkdir -p "$out"
    touch "$out/helm-check"
    runHook postInstall
  '';
}
