{
  actionlint,
  git,
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
    git
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
    printf '%s\n' "$*" >>"$MOCK_HELM_LOG"
    case "$1" in
      lint|template)
        ;;
      show)
        [[ "$MOCK_CHART_EXISTS" == 1 ]]
        ;;
      package)
        chart="$(basename "$2")"
        version="$(awk '$1 == "version:" { print $2 }' "$2/Chart.yaml")"
        touch "$4/$chart-$version.tgz"
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
    (
      cd "$publishRepo"
      releaseHead="$(git rev-parse HEAD)"
      PATH="$publishMockBin:$PATH" \
        MOCK_HELM_LOG="$publishLog" \
        MOCK_CHART_EXISTS=1 \
        RELEASE_HEAD_REVISION="$releaseHead" \
        RELEASE_BASE_REVISION="$releaseHead" \
        RELEASE_REGISTRY=ghcr.io \
        HELM_REGISTRY_REPOSITORY_PATH=0xdsqr/dsqr-dotdev \
        REGISTRY_PASSWORD= \
        ${stdenvNoCC.shell} "$publishScript"
    )
    [[ "$(awk '/^push / { count++ } END { print count + 0 }' "$publishLog")" == 0 ]]

    grep -F 'changesets/action@a45c4d594aa4e2c509dc14a9f2b3b67ba3780d0d # v1.9.0' \
      .github/workflows/release.yml >/dev/null
    grep -F 'commitMode: github-api' .github/workflows/release.yml >/dev/null
    grep -F 'prDraft: create' .github/workflows/release.yml >/dev/null

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
