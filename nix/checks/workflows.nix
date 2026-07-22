{
  actionlint,
  lib,
  shellcheck,
  stdenvNoCC,
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
    shellcheck
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
