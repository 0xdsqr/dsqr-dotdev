#!/usr/bin/env bash

set -euo pipefail

source_revision="${RELEASE_SOURCE_REVISION:-${GITHUB_SHA:-}}"
registry="${RELEASE_REGISTRY:-ghcr.io}"
owner="${RELEASE_REGISTRY_OWNER:-${GITHUB_REPOSITORY_OWNER:-}}"

if [[ ! "$source_revision" =~ ^[0-9a-f]{40}$ ]]; then
  echo "RELEASE_SOURCE_REVISION must be a full lowercase Git commit." >&2
  exit 2
fi

if [[ -z "$owner" ]]; then
  echo "RELEASE_REGISTRY_OWNER or GITHUB_REPOSITORY_OWNER is required." >&2
  exit 2
fi

plan="$(mktemp)"
trap 'rm -f "$plan"' EXIT

changeset status --output "$plan"

release_count="$(jq '.releases | length' "$plan")"
if [[ "$release_count" == "0" ]]; then
  echo "No pending Changesets releases."
  exit 0
fi

changeset version
npm install --package-lock-only --ignore-scripts --no-audit --no-fund

release_for() {
  local package_name="$1"
  jq -e --arg name "$package_name" '.releases[] | select(.name == $name)' "$plan" >/dev/null
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
  local digest

  version="$(jq -r '.version' "$package_file")"
  version_tag="${version//+/-}"
  repository="$registry/$owner/$app"
  candidate="$repository:candidate-$version_tag-$source_revision"
  result_link="result-release-$app"

  nix build ".#$image_attribute" --out-link "$result_link"
  docker load <"$result_link"
  docker tag "$local_image" "$candidate"
  docker push "$candidate"

  digest="sha256:$(docker buildx imagetools inspect "$candidate" --raw | sha256sum | cut -d' ' -f1)"
  if [[ ! "$digest" =~ ^sha256:[0-9a-f]{64}$ ]]; then
    echo "Registry returned an invalid digest for $candidate: $digest" >&2
    exit 1
  fi

  gitops-release-image \
    --app "$app" \
    --version "$version" \
    --digest "$digest" \
    --source-revision "$source_revision"

  echo "$app $version prepared as $candidate@$digest"
}

prepare_app dotdev-web dotdev apps/dotdev/package.json dotdevImage dotdev-web:latest
prepare_app dotdev-studio studio apps/studio/package.json studioImage dotdev-studio:latest
prepare_app dotdev-labs labs apps/labs/package.json labsImage dotdev-labs:latest

node nix/scripts/check-release-versions.mjs
npm run gitops:render >/dev/null
