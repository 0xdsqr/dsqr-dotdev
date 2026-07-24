#!/usr/bin/env bash

set -euo pipefail

head_revision="${RELEASE_HEAD_REVISION:-${GITHUB_SHA:-HEAD}}"
base_revision="${RELEASE_BASE_REVISION:-$head_revision^}"
registry="${RELEASE_REGISTRY:-ghcr.io}"
repository_path="${HELM_REGISTRY_REPOSITORY_PATH:-${GITHUB_REPOSITORY:-}}"
validation_digest="sha256:0000000000000000000000000000000000000000000000000000000000000000"

if [[ -z "$repository_path" ]]; then
  echo "HELM_REGISTRY_REPOSITORY_PATH or GITHUB_REPOSITORY is required." >&2
  exit 2
fi

registry_login_complete=false

login_registry() {
  if [[ "$registry_login_complete" == true || -z "${REGISTRY_PASSWORD:-}" ]]; then
    return 0
  fi
  if [[ -z "${REGISTRY_USERNAME:-}" ]]; then
    echo "REGISTRY_USERNAME is required when REGISTRY_PASSWORD is set." >&2
    exit 2
  fi
  printf '%s' "$REGISTRY_PASSWORD" | helm registry login "$registry" \
    --username "$REGISTRY_USERNAME" \
    --password-stdin >/dev/null
  registry_login_complete=true
}

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
  local package_archive
  local remote_dir
  local remote_archive
  local package_contents
  local remote_contents

  previous_version="$(chart_version_at "$base_revision" "$chart_file")"
  version="$(chart_version_at "$head_revision" "$chart_file")"
  if [[ "$previous_version" == "$version" ]]; then
    echo "$chart remains at $version; skipping publication."
    return 0
  fi

  helm lint "helm/$chart" \
    -f "helm/$chart/values-prod.yaml" \
    --set-string image.digest="$validation_digest"
  helm template "$chart" "helm/$chart" --namespace dsqr \
    -f "helm/$chart/values-prod.yaml" \
    --set-string image.digest="$validation_digest" >/dev/null

  package_dir="$(mktemp -d)"
  package_archive="$package_dir/$chart-$version.tgz"
  helm package "helm/$chart" --destination "$package_dir" >/dev/null

  login_registry
  if helm show chart "oci://$registry/$repository_path/charts/$chart" --version "$version" >/dev/null 2>&1; then
    remote_dir="$(mktemp -d)"
    helm pull "oci://$registry/$repository_path/charts/$chart" \
      --version "$version" \
      --destination "$remote_dir" >/dev/null
    remote_archive="$remote_dir/$chart-$version.tgz"
    package_contents="$package_dir/contents"
    remote_contents="$remote_dir/contents"
    mkdir -p "$package_contents" "$remote_contents"

    tar --extract --gzip --file "$package_archive" --directory "$package_contents"
    tar --extract --gzip --file "$remote_archive" --directory "$remote_contents"

    if ! diff --recursive --no-dereference --brief \
      "$package_contents" "$remote_contents" >/dev/null; then
      echo "Refusing to trust $chart $version: the published chart content does not match the local chart." >&2
      diff --recursive --no-dereference --brief \
        "$package_contents" "$remote_contents" >&2 || true
      rm -rf "$package_dir" "$remote_dir"
      exit 1
    fi
    rm -rf "$package_dir" "$remote_dir"

    echo "$chart $version is already published with matching content."
    return 0
  fi

  helm push "$package_archive" "oci://$registry/$repository_path/charts"
  rm -rf "$package_dir"
}

publish_chart dotdev-web
publish_chart dotdev-studio
publish_chart dotdev-labs
