{
  lib,
  stdenvNoCC,
  nodejs_24,
  gitopsReleaseImage,
  yq-go,
}:
stdenvNoCC.mkDerivation {
  name = "dsqr-dotdev-release-versioning-check";
  src = lib.fileset.toSource {
    root = ../..;
    fileset = lib.fileset.unions [
      ../../.changeset
      ../../package.json
      ../scripts/check-release-versions.mjs
      (lib.fileset.fileFilter (
        file: file.name == "package.json" || file.name == "CHANGELOG.md"
      ) ../../apps)
      (lib.fileset.fileFilter (
        file: file.name == "package.json" || file.name == "CHANGELOG.md"
      ) ../../packages)
      (lib.fileset.fileFilter (
        file:
        builtins.elem file.name [
          "Chart.yaml"
          "values-prod.yaml"
        ]
      ) ../../helm)
      (lib.fileset.fileFilter (file: file.name == "kustomization.yaml") ../../gitops/clusters)
      ../../gitops/values/dotdev-web
      ../../gitops/values/dotdev-studio
      ../../gitops/values/dotdev-labs
    ];
  };

  nativeBuildInputs = [
    gitopsReleaseImage
    nodejs_24
    yq-go
  ];
  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall
    node nix/scripts/check-release-versions.mjs

    testCluster=""
    while IFS= read -r clusterDir; do
      cluster="$(basename "$clusterDir")"
      applications="$clusterDir/applications/kustomization.yaml"
      values="gitops/values/dotdev-web/$cluster.yaml"
      if [ -f "$applications" ] && [ -f "$values" ] &&
        APPLICATION_RESOURCE=dotdev-web.yaml yq -e \
          '.resources[] | select(. == strenv(APPLICATION_RESOURCE))' \
          "$applications" >/dev/null; then
        testCluster="$cluster"
        testClusterApplications="$applications"
        testClusterValues="$values"
        break
      fi
    done < <(find gitops/clusters -mindepth 1 -maxdepth 1 -type d | sort)
    if [ -z "$testCluster" ]; then
      echo "no declared cluster enables dotdev-web with promotion values" >&2
      exit 1
    fi

    testRoot="$TMPDIR/release-promotion-test"
    mkdir -p \
      "$testRoot/apps/dotdev" \
      "$testRoot/helm/dotdev-web" \
      "$testRoot/gitops/clusters/$testCluster/applications" \
      "$testRoot/gitops/values/dotdev-web"
    cp apps/dotdev/package.json "$testRoot/apps/dotdev/package.json"
    cp helm/dotdev-web/Chart.yaml "$testRoot/helm/dotdev-web/Chart.yaml"
    cp "$testClusterApplications" \
      "$testRoot/gitops/clusters/$testCluster/applications/kustomization.yaml"
    cp "$testClusterValues" "$testRoot/gitops/values/dotdev-web/$testCluster.yaml"

    packageVersion="$(node -p 'require(process.argv[1]).version' "$testRoot/apps/dotdev/package.json")"
    (
      cd "$testRoot"
      gitops-release-image \
        --cluster "$testCluster" \
        --app dotdev-web \
        --version "$packageVersion" \
        --digest sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      grep -Fx '  digest: sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' \
        "gitops/values/dotdev-web/$testCluster.yaml" >/dev/null

      cp helm/dotdev-web/Chart.yaml "$TMPDIR/chart-before-failure.yaml"
      cp "gitops/values/dotdev-web/$testCluster.yaml" "$TMPDIR/values-before-failure.yaml"
      if gitops-release-image \
        --cluster "$testCluster" \
        --app dotdev-web \
        --version "$packageVersion" \
        --digest latest >/dev/null 2>&1; then
        echo "release promotion accepted a mutable digest" >&2
        exit 1
      fi
      cmp "$TMPDIR/chart-before-failure.yaml" helm/dotdev-web/Chart.yaml
      cmp "$TMPDIR/values-before-failure.yaml" \
        "gitops/values/dotdev-web/$testCluster.yaml"
    )

    mkdir -p "$out"
    touch "$out/release-versioning-check"
    runHook postInstall
  '';
}
