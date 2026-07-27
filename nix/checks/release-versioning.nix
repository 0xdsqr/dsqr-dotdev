{
  git,
  lib,
  nodejs_24,
  releaseStampImage,
  releaseVerifyCandidates,
  stdenvNoCC,
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
    ];
  };

  nativeBuildInputs = [
    git
    nodejs_24
    releaseStampImage
    releaseVerifyCandidates
    yq-go
  ];
  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall
    node nix/scripts/check-release-versions.mjs

    stampRoot="$TMPDIR/release-stamp-test"
    mkdir -p "$stampRoot/apps/dotdev" "$stampRoot/helm/dotdev-web"
    cp apps/dotdev/package.json "$stampRoot/apps/dotdev/package.json"
    cp helm/dotdev-web/Chart.yaml "$stampRoot/helm/dotdev-web/Chart.yaml"
    cp helm/dotdev-web/values-prod.yaml "$stampRoot/helm/dotdev-web/values-prod.yaml"

    packageVersion="$(node -p 'require(process.argv[1]).version' "$stampRoot/apps/dotdev/package.json")"
    (
      cd "$stampRoot"
      release-stamp-image \
        --app dotdev-web \
        --version "$packageVersion" \
        --digest sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      test "$(yq -r '.image.version' helm/dotdev-web/values-prod.yaml)" = "$packageVersion"
      test "$(yq -r '.image.digest' helm/dotdev-web/values-prod.yaml)" = \
        sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

      cp helm/dotdev-web/Chart.yaml "$TMPDIR/chart-before-failure.yaml"
      cp helm/dotdev-web/values-prod.yaml "$TMPDIR/values-before-failure.yaml"
      if release-stamp-image \
        --app dotdev-web \
        --version "$packageVersion" \
        --digest latest >/dev/null 2>&1; then
        echo "release stamping accepted a mutable digest" >&2
        exit 1
      fi
      cmp "$TMPDIR/chart-before-failure.yaml" helm/dotdev-web/Chart.yaml
      cmp "$TMPDIR/values-before-failure.yaml" helm/dotdev-web/values-prod.yaml
    )

    candidateRoot="$TMPDIR/release-candidate-test"
    mkdir -p \
      "$candidateRoot/apps/dotdev" \
      "$candidateRoot/apps/studio" \
      "$candidateRoot/apps/labs" \
      "$candidateRoot/helm/dotdev-web" \
      "$candidateRoot/helm/dotdev-studio" \
      "$candidateRoot/helm/dotdev-labs"
    cp apps/dotdev/package.json "$candidateRoot/apps/dotdev/package.json"
    cp apps/studio/package.json "$candidateRoot/apps/studio/package.json"
    cp apps/labs/package.json "$candidateRoot/apps/labs/package.json"
    for chart in dotdev-web dotdev-studio dotdev-labs; do
      cp "helm/$chart/Chart.yaml" "$candidateRoot/helm/$chart/Chart.yaml"
      cp "helm/$chart/values-prod.yaml" "$candidateRoot/helm/$chart/values-prod.yaml"
    done

    mockSkopeo="$TMPDIR/mock-skopeo"
    cat >"$mockSkopeo" <<'EOF'
    #!${stdenvNoCC.shell}
    set -euo pipefail
    if [ "$#" -ne 4 ] || [ "$1" != inspect ] || [ "$2" != --format ]; then
      echo "unexpected skopeo invocation" >&2
      exit 2
    fi
    expected="docker://ghcr.io/0xdsqr/dotdev-web:candidate-9.9.9-$MOCK_BASE_SHA"
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

      unchangedOutput="$(
        release-verify-candidates \
          --base-revision "$baseSha" \
          --head-revision "$baseSha" \
          --owner 0xdsqr
      )"
      grep -F 'No application versions changed between' <<<"$unchangedOutput" >/dev/null

      yq -i '.version = "9.9.9"' apps/dotdev/package.json
      yq -i '.version = "9.9.9" | .appVersion = "9.9.9"' helm/dotdev-web/Chart.yaml
      yq -i '
        .image.version = "9.9.9" |
        .image.digest = "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
      ' helm/dotdev-web/values-prod.yaml
      git add .
      git commit -m release >/dev/null
      releaseHead="$(git rev-parse HEAD)"

      MOCK_BASE_SHA="$baseSha" \
        MOCK_CANDIDATE_DIGEST=sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb \
        RELEASE_SKOPEO_BIN="$mockSkopeo" \
        release-verify-candidates \
          --base-revision "$baseSha" \
          --head-revision "$releaseHead" \
          --owner 0xdsqr >/dev/null

      yq -i \
        '.image.digest = "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"' \
        helm/dotdev-web/values-prod.yaml
      git add .
      git commit -m tamper >/dev/null
      tamperedHead="$(git rev-parse HEAD)"

      if MOCK_BASE_SHA="$baseSha" \
        MOCK_CANDIDATE_DIGEST=sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb \
        RELEASE_SKOPEO_BIN="$mockSkopeo" \
        release-verify-candidates \
          --base-revision "$baseSha" \
          --head-revision "$tamperedHead" \
          --owner 0xdsqr >/dev/null 2>&1; then
        echo "candidate verification accepted an arbitrary production digest" >&2
        exit 1
      fi
    )

    mkdir -p "$out"
    touch "$out/release-versioning-check"
    runHook postInstall
  '';
}
