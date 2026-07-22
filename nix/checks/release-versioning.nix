{
  lib,
  stdenvNoCC,
  git,
  nodejs_24,
  gitopsReleaseImage,
  releaseVerifyCandidates,
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
    git
    gitopsReleaseImage
    nodejs_24
    releaseVerifyCandidates
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

    candidateRoot="$TMPDIR/release-candidate-test"
    mkdir -p \
      "$candidateRoot/apps/dotdev" \
      "$candidateRoot/apps/studio" \
      "$candidateRoot/apps/labs" \
      "$candidateRoot/helm/dotdev-web" \
      "$candidateRoot/gitops/clusters/$testCluster/applications" \
      "$candidateRoot/gitops/values/dotdev-web"
    cp apps/dotdev/package.json "$candidateRoot/apps/dotdev/package.json"
    cp apps/studio/package.json "$candidateRoot/apps/studio/package.json"
    cp apps/labs/package.json "$candidateRoot/apps/labs/package.json"
    cp helm/dotdev-web/Chart.yaml "$candidateRoot/helm/dotdev-web/Chart.yaml"
    cp helm/dotdev-web/values-prod.yaml "$candidateRoot/helm/dotdev-web/values-prod.yaml"
    cp "$testClusterApplications" \
      "$candidateRoot/gitops/clusters/$testCluster/applications/kustomization.yaml"
    cp "$testClusterValues" "$candidateRoot/gitops/values/dotdev-web/$testCluster.yaml"

    mockSkopeo="$TMPDIR/mock-skopeo"
    cat >"$mockSkopeo" <<'EOF'
    #!/usr/bin/env bash
    set -euo pipefail
    if [ "$#" -ne 4 ] || [ "$1" != inspect ] || [ "$2" != --format ]; then
      echo "unexpected skopeo invocation" >&2
      exit 2
    fi
    expected="docker://ghcr.io/0xdsqr/dotdev-web:candidate-0.0.3-$MOCK_BASE_SHA"
    if [ "$4" != "$expected" ]; then
      echo "unexpected candidate: $4" >&2
      exit 1
    fi
    printf '%s\n' "$MOCK_CANDIDATE_DIGEST"
    EOF
    chmod +x "$mockSkopeo"

    (
      cd "$candidateRoot"
      git init --initial-branch=master >/dev/null
      git config user.email release-check@example.invalid
      git config user.name release-check
      git add .
      git commit -m base >/dev/null
      baseSha="$(git rev-parse HEAD)"

      yq -i '.version = "0.0.3"' apps/dotdev/package.json
      yq -i '.version = "0.0.3" | .appVersion = "0.0.3"' helm/dotdev-web/Chart.yaml
      yq -i '
        .image.version = "0.0.3" |
        .image.digest = "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
      ' "gitops/values/dotdev-web/$testCluster.yaml"
      git add .
      git commit -m release >/dev/null
      releaseHead="$(git rev-parse HEAD)"

      MOCK_BASE_SHA="$baseSha" \
        MOCK_CANDIDATE_DIGEST=sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb \
        RELEASE_SKOPEO_BIN="$mockSkopeo" \
        release-verify-candidates \
          --base-revision "$baseSha" \
          --head-revision "$releaseHead" \
          --cluster "$testCluster" \
          --owner 0xdsqr >/dev/null

      yq -i \
        '.image.digest = "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"' \
        "gitops/values/dotdev-web/$testCluster.yaml"
      git add .
      git commit -m tamper >/dev/null
      tamperedHead="$(git rev-parse HEAD)"

      if MOCK_BASE_SHA="$baseSha" \
        MOCK_CANDIDATE_DIGEST=sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb \
        RELEASE_SKOPEO_BIN="$mockSkopeo" \
        release-verify-candidates \
          --base-revision "$baseSha" \
          --head-revision "$tamperedHead" \
          --cluster "$testCluster" \
          --owner 0xdsqr >/dev/null 2>&1; then
        echo "candidate verification accepted an arbitrary promotion digest" >&2
        exit 1
      fi
    )

    mkdir -p "$out"
    touch "$out/release-versioning-check"
    runHook postInstall
  '';
}
