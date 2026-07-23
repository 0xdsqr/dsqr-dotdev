#!/usr/bin/env bash

set -euo pipefail

source_revision="${RELEASE_SOURCE_REVISION:-${GITHUB_SHA:-}}"
registry="${RELEASE_REGISTRY:-ghcr.io}"
owner="${RELEASE_REGISTRY_OWNER:-${GITHUB_REPOSITORY_OWNER:-}}"
cluster="${RELEASE_CLUSTER:-hub-a}"
candidate_plan="${RELEASE_CANDIDATE_PLAN:-}"

if [[ ! "$source_revision" =~ ^[0-9a-f]{40}$ ]]; then
  echo "RELEASE_SOURCE_REVISION must be a full lowercase Git commit." >&2
  exit 2
fi

if [[ -z "$owner" ]]; then
  echo "RELEASE_REGISTRY_OWNER or GITHUB_REPOSITORY_OWNER is required." >&2
  exit 2
fi

changeset_plan="$(mktemp)"
security_artifacts="$(mktemp -d)"
trap 'rm -f "$changeset_plan"; rm -rf "$security_artifacts"' EXIT

if [[ -z "$candidate_plan" ]]; then
  candidate_plan="$security_artifacts/candidates.json"
fi
mkdir -p "$(dirname "$candidate_plan")"
printf '%s\n' '[]' >"$candidate_plan"

sbom_directory="${RELEASE_SBOM_DIRECTORY:-$(dirname "$candidate_plan")/sboms}"
mkdir -p "$sbom_directory"

changeset status --output "$changeset_plan"

release_count="$(jq '.releases | length' "$changeset_plan")"
if [[ "$release_count" == "0" ]]; then
  echo "No pending Changesets releases."
  exit 0
fi

changeset version
npm install --package-lock-only --ignore-scripts --no-audit --no-fund

release_for() {
  local package_name="$1"
  jq -e --arg name "$package_name" \
    '.releases[] | select(.name == $name)' "$changeset_plan" >/dev/null
}

prepare_app() {
  local app="$1"
  local package_name="$2"
  local package_file="$3"
  local image_attribute="$4"
  local local_image="$5"

  if ! release_for "$package_name"; then
    return 0
  fi

  local version
  local version_tag
  local repository
  local candidate
  local result_link
  local sbom
  local sbom_size
  local digest
  local candidate_plan_next

  version="$(jq -r '.version' "$package_file")"
  version_tag="${version//+/-}"
  repository="$registry/$owner/$app"
  candidate="$repository:candidate-$version_tag-$source_revision"
  result_link="result-release-$app"
  sbom="$sbom_directory/$app.spdx.json"

  nix build ".#$image_attribute" --out-link "$result_link"
  docker load <"$result_link"
  docker tag "$local_image" "$candidate"

  syft "docker:$candidate" --output "spdx-json=$sbom"
  sbom_size="$(wc -c <"$sbom" | tr -d '[:space:]')"
  if [[ ! "$sbom_size" =~ ^[0-9]+$ ]] || ((sbom_size > 16 * 1024 * 1024)); then
    echo "The $app SPDX SBOM exceeds the 16 MiB attestation limit." >&2
    exit 1
  fi

  grype "sbom:$sbom" --fail-on medium
  docker push "$candidate"

  digest="$(skopeo inspect --format '{{.Digest}}' "docker://$candidate")"
  if [[ ! "$digest" =~ ^sha256:[0-9a-f]{64}$ ]]; then
    echo "Registry returned an invalid digest for $candidate: $digest" >&2
    exit 1
  fi

  gitops-release-image \
    --cluster "$cluster" \
    --app "$app" \
    --version "$version" \
    --digest "$digest"

  candidate_plan_next="$(mktemp "$(dirname "$candidate_plan")/.candidates.XXXXXX")"
  jq \
    --arg app "$app" \
    --arg repository "$repository" \
    --arg digest "$digest" \
    --arg sbom "$sbom" \
    '. + [{
      app: $app,
      repository: $repository,
      digest: $digest,
      sbom: $sbom
    }]' \
    "$candidate_plan" >"$candidate_plan_next"
  mv "$candidate_plan_next" "$candidate_plan"

  echo "$app $version prepared as $candidate@$digest"
}

prepare_app dotdev-web dotdev apps/dotdev/package.json dotdevImage dotdev-web:latest
prepare_app dotdev-studio studio apps/studio/package.json studioImage dotdev-studio:latest
prepare_app dotdev-labs labs apps/labs/package.json labsImage dotdev-labs:latest

node nix/scripts/check-release-versions.mjs
npm run gitops:render >/dev/null
