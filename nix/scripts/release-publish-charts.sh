#!/usr/bin/env bash

set -euo pipefail

head_revision="${RELEASE_HEAD_REVISION:-${GITHUB_SHA:-HEAD}}"
base_revision="${RELEASE_BASE_REVISION:-$head_revision^}"
registry="${RELEASE_REGISTRY:-ghcr.io}"
repository_path="${HELM_REGISTRY_REPOSITORY_PATH:-${GITHUB_REPOSITORY:-}}"

if [[ -z "$repository_path" ]]; then
  echo "HELM_REGISTRY_REPOSITORY_PATH or GITHUB_REPOSITORY is required." >&2
  exit 2
fi

if [[ -n "${REGISTRY_PASSWORD:-}" ]]; then
  if [[ -z "${REGISTRY_USERNAME:-}" ]]; then
    echo "REGISTRY_USERNAME is required when REGISTRY_PASSWORD is set." >&2
    exit 2
  fi
  printf '%s' "$REGISTRY_PASSWORD" | helm registry login "$registry" \
    --username "$REGISTRY_USERNAME" \
    --password-stdin >/dev/null
fi

chart_version_at() {
  local revision="$1"
  local chart_file="$2"
  git show "$revision:$chart_file" | yq -r '.version'
}

publish_chart() {
  local chart="$1"
  local chart_file="helm/$chart/Chart.yaml"
  local previous_version
  local version
  local package_dir

  previous_version="$(chart_version_at "$base_revision" "$chart_file")"
  version="$(chart_version_at "$head_revision" "$chart_file")"
  if [[ "$previous_version" == "$version" ]]; then
    return 0
  fi

  helm lint "helm/$chart"
  helm template "$chart" "helm/$chart" --namespace dsqr \
    -f "helm/$chart/values-prod.yaml" >/dev/null

  if helm show chart "oci://$registry/$repository_path/charts/$chart" --version "$version" >/dev/null 2>&1; then
    echo "$chart $version is already published."
    return 0
  fi

  package_dir="$(mktemp -d)"
  helm package "helm/$chart" --destination "$package_dir" >/dev/null
  helm push "$package_dir/$chart-$version.tgz" "oci://$registry/$repository_path/charts"
  rm -rf "$package_dir"
}

publish_chart dotdev-web
publish_chart dotdev-studio
publish_chart dotdev-labs
