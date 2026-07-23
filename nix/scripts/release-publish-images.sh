#!/usr/bin/env bash

set -euo pipefail

head_revision="${RELEASE_HEAD_REVISION:-${GITHUB_SHA:-HEAD}}"
base_revision="${RELEASE_BASE_REVISION:-$head_revision^}"
registry="${RELEASE_REGISTRY:-ghcr.io}"
owner="${RELEASE_REGISTRY_OWNER:-${GITHUB_REPOSITORY_OWNER:-}}"

if [[ -z "$owner" ]]; then
  echo "RELEASE_REGISTRY_OWNER or GITHUB_REPOSITORY_OWNER is required." >&2
  exit 2
fi

if [[ -n "${REGISTRY_PASSWORD:-}" ]]; then
  if [[ -z "${REGISTRY_USERNAME:-}" ]]; then
    echo "REGISTRY_USERNAME is required when REGISTRY_PASSWORD is set." >&2
    exit 2
  fi
  printf '%s' "$REGISTRY_PASSWORD" | skopeo login \
    --username "$REGISTRY_USERNAME" \
    --password-stdin \
    "$registry" >/dev/null
fi

version_at() {
  local revision="$1"
  local package_file="$2"
  git show "$revision:$package_file" | jq -r '.version'
}

publish_app() {
  local app="$1"
  local package_file="$2"
  local chart_file="$3"
  local production_values_file="$4"
  local cluster_values_file="$5"

  local previous_version
  local version
  local chart_version
  local app_version
  local promoted_version
  local digest
  local repository
  local published_digest

  previous_version="$(version_at "$base_revision" "$package_file")"
  version="$(version_at "$head_revision" "$package_file")"

  chart_version="$(yq -r '.version' "$chart_file")"
  app_version="$(yq -r '.appVersion' "$chart_file")"
  promoted_version="$(yq -r '.image.version' "$cluster_values_file")"
  digest="$(yq -r '.image.digest' "$cluster_values_file")"
  repository="$(yq -r '.image.repository' "$production_values_file")"

  if [[ "$chart_version" != "$version" || "$app_version" != "$version" || "$promoted_version" != "$version" ]]; then
    echo "$app package, chart, app, and hub-a promotion versions must agree at $version." >&2
    exit 1
  fi
  if [[ ! "$digest" =~ ^sha256:[0-9a-f]{64}$ ]]; then
    echo "$app has an invalid production digest: $digest" >&2
    exit 1
  fi
  if [[ "$repository" != "$registry/$owner/$app" ]]; then
    echo "$app repository is $repository; expected $registry/$owner/$app." >&2
    exit 1
  fi

  if published_digest="$(skopeo inspect --format '{{.Digest}}' "docker://$repository:$version" 2>/dev/null)"; then
    if [[ "$published_digest" != "$digest" ]]; then
      echo "Refusing to replace $repository:$version ($published_digest) with $digest." >&2
      exit 1
    fi
    echo "$repository:$version already resolves to $digest"
    return 0
  fi

  if [[ "$previous_version" == "$version" ]]; then
    echo "$repository:$version is missing from the registry; publishing the current version."
  fi

  skopeo copy --all --preserve-digests \
    "docker://$repository@$digest" \
    "docker://$repository:$version"

  published_digest="$(skopeo inspect --format '{{.Digest}}' "docker://$repository:$version")"
  if [[ "$published_digest" != "$digest" ]]; then
    echo "$repository:$version resolved to $published_digest, expected $digest." >&2
    exit 1
  fi

  echo "$repository:$version -> $digest"
}

publish_app dotdev-web apps/dotdev/package.json helm/dotdev-web/Chart.yaml \
  helm/dotdev-web/values-prod.yaml gitops/values/dotdev-web/hub-a.yaml
publish_app dotdev-studio apps/studio/package.json helm/dotdev-studio/Chart.yaml \
  helm/dotdev-studio/values-prod.yaml gitops/values/dotdev-studio/hub-a.yaml
publish_app dotdev-labs apps/labs/package.json helm/dotdev-labs/Chart.yaml \
  helm/dotdev-labs/values-prod.yaml gitops/values/dotdev-labs/hub-a.yaml
