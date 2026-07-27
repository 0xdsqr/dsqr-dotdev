{
  actionlint,
  coreutils,
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
      ../../.grype.yaml
      ../../.github/actions
      ../../.github/workflows
      ../../nix/lib/smoke-oci-image.sh
      ../scripts/release-prepare.sh
      ../scripts/release-publish-images.sh
      ../scripts/release-stamp-image.sh
      ../scripts/release-verify-candidates.sh
    ];
  };

  nativeBuildInputs = [
    actionlint
    coreutils
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
      nix/scripts/release-prepare.sh \
      nix/scripts/release-publish-images.sh \
      nix/scripts/release-stamp-image.sh \
      nix/scripts/release-verify-candidates.sh

    imagePublishTest="$TMPDIR/release-publish-images"
    imagePublishMockBin="$imagePublishTest/bin"
    imagePublishRepo="$imagePublishTest/repo"
    imagePublishLog="$imagePublishTest/skopeo.log"
    imagePublishState="$imagePublishTest/published-tags"
    imagePublishScript="$PWD/nix/scripts/release-publish-images.sh"
    validationDigest="sha256:0000000000000000000000000000000000000000000000000000000000000000"
    mkdir -p \
      "$imagePublishMockBin" \
      "$imagePublishRepo/apps/dotdev" \
      "$imagePublishRepo/apps/studio" \
      "$imagePublishRepo/apps/labs" \
      "$imagePublishRepo/helm/dotdev-web" \
      "$imagePublishRepo/helm/dotdev-studio" \
      "$imagePublishRepo/helm/dotdev-labs"

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
    [[ ! -s "$imagePublishLog" ]]

    (
      cd "$imagePublishRepo"
      sed -i 's/0\.0\.3/0.0.4/g' \
        apps/*/package.json \
        helm/*/Chart.yaml \
        helm/*/values-prod.yaml
      git add .
      git commit -m release >/dev/null
      releaseHead="$(git rev-parse HEAD)"

      PATH="$imagePublishMockBin:$PATH" \
        MOCK_IMAGE_DIGEST="$validationDigest" \
        MOCK_SKOPEO_LOG="$imagePublishLog" \
        MOCK_SKOPEO_STATE="$imagePublishState" \
        RELEASE_HEAD_REVISION="$releaseHead" \
        RELEASE_BASE_REVISION="$releaseHead^" \
        RELEASE_REGISTRY=ghcr.io \
        RELEASE_REGISTRY_OWNER=0xdsqr \
        REGISTRY_PASSWORD= \
        ${stdenvNoCC.shell} "$imagePublishScript"
    )
    [[ "$(grep -c '^copy ' "$imagePublishLog")" == 3 ]]
    for app in dotdev-web dotdev-studio dotdev-labs; do
      grep -Fqx \
        "copy --all --preserve-digests docker://ghcr.io/0xdsqr/$app@$validationDigest docker://ghcr.io/0xdsqr/$app:0.0.4" \
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
    grep -F 'DeterminateSystems/determinate-nix-action@d96678350ffd6a456235832eb11e1c491589b7bb # v3.21.8' \
      .github/actions/setup-nix/action.yml >/dev/null
    grep -F 'DeterminateSystems/flakehub-cache-action@77c6bddd7d747943530aaa578c57f233ee5d920e # v3.21.8' \
      .github/actions/setup-nix/action.yml >/dev/null
    yq -e '.permissions."id-token" == "write"' .github/workflows/ci.yml >/dev/null
    yq -e '.concurrency."cancel-in-progress" != false' .github/workflows/ci.yml >/dev/null
    yq -e '.jobs."build-app".strategy.matrix != null' .github/workflows/ci.yml >/dev/null
    yq -e '.jobs.required.needs | contains(["dependency-security", "codeql"])' \
      .github/workflows/ci.yml >/dev/null
    grep -F 'commitMode: github-api' .github/workflows/release.yml >/dev/null
    grep -F 'prDraft: create' .github/workflows/release.yml >/dev/null
    yq -e '.concurrency."cancel-in-progress" == false' \
      .github/workflows/release.yml >/dev/null
    grep -F 'grype "sbom:$sbom" --fail-on medium' \
      nix/scripts/release-prepare.sh >/dev/null
    grep -F 'skopeo inspect --format' nix/scripts/release-prepare.sh >/dev/null
    grep -F -- '--predicate-type https://spdx.dev/Document/v2.3' \
      nix/scripts/release-verify-candidates.sh >/dev/null

    mkdir -p "$out"
    touch "$out/workflow-check"
    runHook postInstall
  '';
}
