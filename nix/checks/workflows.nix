{
  actionlint,
  coreutils,
  diffutils,
  git,
  gnutar,
  gzip,
  jq,
  lib,
  shellcheck,
  stdenvNoCC,
  yq-go,
}:
stdenvNoCC.mkDerivation {
  name = "dsqr-dotdev-workflow-check";
  src = lib.fileset.toSource {
    root = ../..;
    fileset = lib.fileset.unions [
      ../../.grype.yaml
      ../../.github/workflows
      ../../nix/lib/smoke-oci-image.sh
      ../scripts/gitops-cleanup-tracking.sh
      ../scripts/release-prepare.sh
      ../scripts/gitops-generate-applications.sh
      ../scripts/gitops-release-image.sh
      ../scripts/gitops-render.sh
      ../scripts/check-gitops.sh
      ../scripts/release-publish-charts.sh
      ../scripts/release-publish-images.sh
      ../scripts/release-verify-candidates.sh
    ];
  };

  nativeBuildInputs = [
    actionlint
    coreutils
    diffutils
    git
    gnutar
    gzip
    jq
    shellcheck
    yq-go
  ];

  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall

    actionlint -no-color .github/workflows/*.yml
    shellcheck \
      nix/lib/smoke-oci-image.sh \
      nix/scripts/check-gitops.sh \
      nix/scripts/gitops-cleanup-tracking.sh \
      nix/scripts/gitops-generate-applications.sh \
      nix/scripts/gitops-release-image.sh \
      nix/scripts/gitops-render.sh \
      nix/scripts/release-prepare.sh \
      nix/scripts/release-publish-charts.sh \
      nix/scripts/release-publish-images.sh \
      nix/scripts/release-verify-candidates.sh

    cleanupTest="$TMPDIR/gitops-cleanup-tracking"
    mockBin="$cleanupTest/bin"
    mkdir -p "$mockBin"
    cat >"$mockBin/helm" <<'EOF'
    #!${stdenvNoCC.shell}
    set -euo pipefail
    case "$1 $2" in
      "status argocd")
        printf '%s\n' '{"name":"argocd","namespace":"argocd","info":{"status":"deployed"}}'
        ;;
      "get manifest")
        cat <<'MANIFEST'
    apiVersion: v1
    kind: ServiceAccount
    metadata:
      name: first
      namespace: argocd
    ---
    apiVersion: v1
    kind: ConfigMap
    metadata:
      name: second
      namespace: argocd
    MANIFEST
        ;;
      *)
        echo "unexpected helm invocation: $*" >&2
        exit 2
        ;;
    esac
    EOF
    cat >"$mockBin/kubectl" <<'EOF'
    #!${stdenvNoCC.shell}
    set -euo pipefail
    case "$*" in
      *"get applications.argoproj.io argocd"*)
        ;;
      *"get ConfigMap second"*)
        printf '%s\n' 'v1|ConfigMap|argocd|second|argocd|argocd|argocd:/ConfigMap:argocd/second'
        ;;
      *"get ServiceAccount first"*)
        printf '%s\n' 'v1|ServiceAccount|argocd|first|argocd|argocd|argocd:/ServiceAccount:argocd/first'
        ;;
      *)
        echo "unexpected kubectl invocation: $*" >&2
        exit 2
        ;;
    esac
    EOF
    chmod +x "$mockBin/helm" "$mockBin/kubectl"

    cleanupOutput="$(
      PATH="$mockBin:$PATH" ${stdenvNoCC.shell} \
        nix/scripts/gitops-cleanup-tracking.sh
    )"
    [[ "$(grep -c '^DRY-RUN remove ' <<<"$cleanupOutput")" == 2 ]]
    grep -Fqx \
      'Dry run complete: 2 stale tracking annotations are eligible for removal.' \
      <<<"$cleanupOutput"

    publishTest="$TMPDIR/release-publish-charts"
    publishMockBin="$publishTest/bin"
    publishRepo="$publishTest/repo"
    publishLog="$publishTest/helm.log"
    publishArchiveLog="$publishTest/archive.log"
    publishScript="$PWD/nix/scripts/release-publish-charts.sh"
    validationDigest="sha256:0000000000000000000000000000000000000000000000000000000000000000"
    mkdir -p "$publishMockBin" "$publishRepo/helm"

    for chart in dotdev-web dotdev-studio dotdev-labs; do
      mkdir -p "$publishRepo/helm/$chart"
      cat >"$publishRepo/helm/$chart/Chart.yaml" <<EOF
    apiVersion: v2
    name: $chart
    type: application
    version: 0.0.3
    appVersion: 0.0.3
    EOF
      touch "$publishRepo/helm/$chart/values-prod.yaml"
    done

    cat >"$publishMockBin/helm" <<'EOF'
    #!${stdenvNoCC.shell}
    set -euo pipefail
    make_archive() {
      local source="$1"
      local chart="$2"
      local destination="$3"
      local mtime="$4"
      local mismatch="$5"
      local archive_root

      archive_root="$(mktemp -d)"
      mkdir -p "$archive_root/$chart"
      cp -R "$source/." "$archive_root/$chart/"
      if [[ "$mismatch" == 1 ]]; then
        printf '%s\n' '# registry content was changed' >>"$archive_root/$chart/Chart.yaml"
      fi
      tar \
        --create \
        --gzip \
        --file "$destination" \
        --directory "$archive_root" \
        --sort=name \
        --mtime="$mtime" \
        --owner=0 \
        --group=0 \
        --numeric-owner \
        "$chart"
      rm -rf "$archive_root"
    }

    printf '%s\n' "$*" >>"$MOCK_HELM_LOG"
    case "$1" in
      lint|template)
        ;;
      show)
        [[ "$MOCK_CHART_EXISTS" == 1 ]]
        ;;
      pull)
        chart="''${2##*/}"
        version="$4"
        destination="$6"
        mkdir -p "$destination"
        mismatch=0
        if [[ "''${MOCK_CHART_MATCH:-1}" != 1 ]]; then
          mismatch=1
        fi
        make_archive \
          "helm/$chart" \
          "$chart" \
          "$destination/$chart-$version.tgz" \
          "@978307200" \
          "$mismatch"
        printf '%s remote %s\n' \
          "$chart" \
          "$(sha256sum "$destination/$chart-$version.tgz" | cut -d' ' -f1)" \
          >>"$MOCK_HELM_ARCHIVE_LOG"
        ;;
      package)
        chart="$(basename "$2")"
        version="$(awk '$1 == "version:" { print $2 }' "$2/Chart.yaml")"
        make_archive \
          "$2" \
          "$chart" \
          "$4/$chart-$version.tgz" \
          "@946684800" \
          0
        printf '%s local %s\n' \
          "$chart" \
          "$(sha256sum "$4/$chart-$version.tgz" | cut -d' ' -f1)" \
          >>"$MOCK_HELM_ARCHIVE_LOG"
        ;;
      push)
        [[ -f "$2" ]]
        ;;
      *)
        echo "unexpected helm invocation: $*" >&2
        exit 2
        ;;
    esac
    EOF
    chmod +x "$publishMockBin/helm"

    (
      cd "$publishRepo"
      git init --initial-branch=master >/dev/null
      git config user.email release-check@example.invalid
      git config user.name release-check
      git add .
      git commit -m release >/dev/null
      releaseHead="$(git rev-parse HEAD)"

      PATH="$publishMockBin:$PATH" \
        MOCK_HELM_LOG="$publishLog" \
        MOCK_HELM_ARCHIVE_LOG="$publishArchiveLog" \
        MOCK_CHART_EXISTS=0 \
        RELEASE_HEAD_REVISION="$releaseHead" \
        RELEASE_BASE_REVISION="$releaseHead" \
        RELEASE_REGISTRY=ghcr.io \
        HELM_REGISTRY_REPOSITORY_PATH=0xdsqr/dsqr-dotdev \
        REGISTRY_PASSWORD= \
        ${stdenvNoCC.shell} "$publishScript"
    )

    for chart in dotdev-web dotdev-studio dotdev-labs; do
      grep -Fqx \
        "lint helm/$chart -f helm/$chart/values-prod.yaml --set-string image.digest=$validationDigest" \
        "$publishLog"
      grep -Fqx \
        "template $chart helm/$chart --namespace dsqr -f helm/$chart/values-prod.yaml --set-string image.digest=$validationDigest" \
        "$publishLog"
    done
    [[ "$(awk '/^push / { count++ } END { print count + 0 }' "$publishLog")" == 3 ]]

    : >"$publishLog"
    : >"$publishArchiveLog"
    (
      cd "$publishRepo"
      releaseHead="$(git rev-parse HEAD)"
      PATH="$publishMockBin:$PATH" \
        MOCK_HELM_LOG="$publishLog" \
        MOCK_HELM_ARCHIVE_LOG="$publishArchiveLog" \
        MOCK_CHART_EXISTS=1 \
        MOCK_CHART_MATCH=1 \
        RELEASE_HEAD_REVISION="$releaseHead" \
        RELEASE_BASE_REVISION="$releaseHead" \
        RELEASE_REGISTRY=ghcr.io \
        HELM_REGISTRY_REPOSITORY_PATH=0xdsqr/dsqr-dotdev \
        REGISTRY_PASSWORD= \
        ${stdenvNoCC.shell} "$publishScript"
    )
    [[ "$(awk '/^push / { count++ } END { print count + 0 }' "$publishLog")" == 0 ]]
    for chart in dotdev-web dotdev-studio dotdev-labs; do
      localArchiveDigest="$(
        awk -v chart="$chart" '$1 == chart && $2 == "local" { print $3 }' \
          "$publishArchiveLog"
      )"
      remoteArchiveDigest="$(
        awk -v chart="$chart" '$1 == chart && $2 == "remote" { print $3 }' \
          "$publishArchiveLog"
      )"
      [[ -n "$localArchiveDigest" ]]
      [[ -n "$remoteArchiveDigest" ]]
      [[ "$localArchiveDigest" != "$remoteArchiveDigest" ]]
    done

    : >"$publishLog"
    : >"$publishArchiveLog"
    if (
      cd "$publishRepo"
      releaseHead="$(git rev-parse HEAD)"
      PATH="$publishMockBin:$PATH" \
        MOCK_HELM_LOG="$publishLog" \
        MOCK_HELM_ARCHIVE_LOG="$publishArchiveLog" \
        MOCK_CHART_EXISTS=1 \
        MOCK_CHART_MATCH=0 \
        RELEASE_HEAD_REVISION="$releaseHead" \
        RELEASE_BASE_REVISION="$releaseHead" \
        RELEASE_REGISTRY=ghcr.io \
        HELM_REGISTRY_REPOSITORY_PATH=0xdsqr/dsqr-dotdev \
        REGISTRY_PASSWORD= \
        ${stdenvNoCC.shell} "$publishScript" >/dev/null 2>&1
    ); then
      echo "chart publication accepted a mismatched existing OCI archive" >&2
      exit 1
    fi
    [[ "$(awk '/^push / { count++ } END { print count + 0 }' "$publishLog")" == 0 ]]

    imagePublishTest="$TMPDIR/release-publish-images"
    imagePublishMockBin="$imagePublishTest/bin"
    imagePublishRepo="$imagePublishTest/repo"
    imagePublishLog="$imagePublishTest/skopeo.log"
    imagePublishState="$imagePublishTest/published-tags"
    imagePublishScript="$PWD/nix/scripts/release-publish-images.sh"
    mkdir -p \
      "$imagePublishMockBin" \
      "$imagePublishRepo/apps/dotdev" \
      "$imagePublishRepo/apps/studio" \
      "$imagePublishRepo/apps/labs" \
      "$imagePublishRepo/helm/dotdev-web" \
      "$imagePublishRepo/helm/dotdev-studio" \
      "$imagePublishRepo/helm/dotdev-labs" \
      "$imagePublishRepo/gitops/values/dotdev-web" \
      "$imagePublishRepo/gitops/values/dotdev-studio" \
      "$imagePublishRepo/gitops/values/dotdev-labs"

    for package in dotdev studio labs; do
      cat >"$imagePublishRepo/apps/$package/package.json" <<EOF
    {"name":"$package","version":"0.0.3"}
    EOF
    done
    for app in dotdev-web dotdev-studio dotdev-labs; do
      cat >"$imagePublishRepo/helm/$app/Chart.yaml" <<EOF
    apiVersion: v2
    name: $app
    type: application
    version: 0.0.3
    appVersion: 0.0.3
    EOF
      cat >"$imagePublishRepo/helm/$app/values-prod.yaml" <<EOF
    image:
      repository: ghcr.io/0xdsqr/$app
    EOF
      cat >"$imagePublishRepo/gitops/values/$app/hub-a.yaml" <<EOF
    image:
      version: 0.0.3
      digest: $validationDigest
    EOF
    done

    cat >"$imagePublishMockBin/skopeo" <<'EOF'
    #!${stdenvNoCC.shell}
    set -euo pipefail
    case "$1" in
      inspect)
        reference="$4"
        if grep -Fqx "$reference" "$MOCK_SKOPEO_STATE" 2>/dev/null; then
          printf '%s\n' "$MOCK_IMAGE_DIGEST"
        else
          exit 1
        fi
        ;;
      copy)
        printf '%s\n' "$*" >>"$MOCK_SKOPEO_LOG"
        printf '%s\n' "$5" >>"$MOCK_SKOPEO_STATE"
        ;;
      *)
        echo "unexpected skopeo invocation: $*" >&2
        exit 2
        ;;
    esac
    EOF
    chmod +x "$imagePublishMockBin/skopeo"

    (
      cd "$imagePublishRepo"
      git init --initial-branch=master >/dev/null
      git config user.email release-check@example.invalid
      git config user.name release-check
      git add .
      git commit -m release >/dev/null
      releaseHead="$(git rev-parse HEAD)"

      PATH="$imagePublishMockBin:$PATH" \
        MOCK_IMAGE_DIGEST="$validationDigest" \
        MOCK_SKOPEO_LOG="$imagePublishLog" \
        MOCK_SKOPEO_STATE="$imagePublishState" \
        RELEASE_HEAD_REVISION="$releaseHead" \
        RELEASE_BASE_REVISION="$releaseHead" \
        RELEASE_REGISTRY=ghcr.io \
        RELEASE_REGISTRY_OWNER=0xdsqr \
        REGISTRY_PASSWORD= \
        ${stdenvNoCC.shell} "$imagePublishScript"
    )
    [[ "$(grep -c '^copy ' "$imagePublishLog")" == 3 ]]
    for app in dotdev-web dotdev-studio dotdev-labs; do
      grep -Fqx \
        "copy --all --preserve-digests docker://ghcr.io/0xdsqr/$app@$validationDigest docker://ghcr.io/0xdsqr/$app:0.0.3" \
        "$imagePublishLog"
    done

    grep -F 'changesets/action@a45c4d594aa4e2c509dc14a9f2b3b67ba3780d0d # v1.9.0' \
      .github/workflows/release.yml >/dev/null
    grep -F 'actions/attest@f7c74d28b9d84cb8768d0b8ca14a4bac6ef463e6 # v4.2.0' \
      .github/workflows/release.yml >/dev/null
    grep -F 'github/codeql-action/init@e4fba868fa4b1b91e1fdab776edc8cfbe6e9fb81 # v4.37.3' \
      .github/workflows/ci.yml >/dev/null
    grep -F 'github/codeql-action/analyze@e4fba868fa4b1b91e1fdab776edc8cfbe6e9fb81 # v4.37.3' \
      .github/workflows/ci.yml >/dev/null
    yq -e '.jobs.required.needs | contains(["dependency-security", "codeql"])' \
      .github/workflows/ci.yml >/dev/null
    grep -F 'commitMode: github-api' .github/workflows/release.yml >/dev/null
    grep -F 'prDraft: create' .github/workflows/release.yml >/dev/null
    yq -e '.concurrency."cancel-in-progress" == false' \
      .github/workflows/release.yml >/dev/null
    grep -F 'grype "sbom:$sbom" --fail-on medium' \
      nix/scripts/release-prepare.sh >/dev/null
    [[ "$(yq '.ignore | length' .grype.yaml)" == 2 ]]
    yq -e '
      .ignore[] |
      select(
        .vulnerability == "CVE-2024-9410" and
        .package.name == "ada" and
        .package.version == "3.4.4" and
        .package.type == "nix" and
        .reason != ""
      )
    ' .grype.yaml >/dev/null
    yq -e '
      .ignore[] |
      select(
        .vulnerability == "CVE-2026-58055" and
        .package.name == "nghttp2" and
        .package.version == "1.69.0" and
        .package.type == "nix" and
        .reason != ""
      )
    ' .grype.yaml >/dev/null
    grep -F 'skopeo inspect --format' \
      nix/scripts/release-prepare.sh >/dev/null
    grep -F -- '--predicate-type https://spdx.dev/Document/v2.3' \
      nix/scripts/release-verify-candidates.sh >/dev/null

    if grep -R -E 'gitopsTagImages|Propose GitOps image tags|0\.1\.\$\{\{ github\.run_number \}\}' \
      .github/workflows; then
      echo "obsolete promotion or run-number release behavior remains" >&2
      exit 1
    fi

    mkdir -p "$out"
    touch "$out/workflow-check"

    runHook postInstall
  '';
}
