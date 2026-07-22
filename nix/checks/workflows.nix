{
  actionlint,
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
