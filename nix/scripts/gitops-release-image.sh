#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  gitops-release-image --cluster <cluster> --app <app> --version <semver> --digest <sha256:digest>

Apps:
  dotdev-web
  dotdev-studio
  dotdev-labs

The application package version is the release source of truth. The chart is
stamped with that version, while the immutable image version and digest are
promoted only into the selected cluster's GitOps values file.
EOF
}

cluster=""
app=""
version=""
digest=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --cluster)
      cluster="${2:-}"
      shift 2
      ;;
    --app)
      app="${2:-}"
      shift 2
      ;;
    --version)
      version="${2:-}"
      shift 2
      ;;
    --digest)
      digest="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument '$1'." >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "$cluster" || -z "$app" || -z "$version" || -z "$digest" ]]; then
  usage >&2
  exit 2
fi

if [[ ! "$cluster" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]]; then
  echo "Cluster '$cluster' is not a valid DNS label." >&2
  exit 2
fi
if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$ ]]; then
  echo "Version '$version' is not valid SemVer." >&2
  exit 2
fi
if [[ ! "$digest" =~ ^sha256:[0-9a-f]{64}$ ]]; then
  echo "Digest must be a lowercase sha256 digest." >&2
  exit 2
fi

case "$app" in
  dotdev-web)
    package_file="apps/dotdev/package.json"
    chart_file="helm/dotdev-web/Chart.yaml"
    ;;
  dotdev-studio)
    package_file="apps/studio/package.json"
    chart_file="helm/dotdev-studio/Chart.yaml"
    ;;
  dotdev-labs)
    package_file="apps/labs/package.json"
    chart_file="helm/dotdev-labs/Chart.yaml"
    ;;
  *)
    echo "Unknown app '$app'." >&2
    usage >&2
    exit 2
    ;;
esac

cluster_config="gitops/clusters/$cluster/config.yaml"
cluster_values="gitops/values/$app/$cluster.yaml"
if [[ ! -f "$cluster_config" ]]; then
  echo "Unknown cluster '$cluster': $cluster_config does not exist." >&2
  exit 1
fi
if [[ ! -f "$cluster_values" ]]; then
  echo "Missing cluster promotion values: $cluster_values" >&2
  exit 1
fi
if ! APPLICATION="$app" yq -e '.applications[] | select(. == strenv(APPLICATION))' \
  "$cluster_config" >/dev/null; then
  echo "Application '$app' is not enabled for cluster '$cluster'." >&2
  exit 1
fi

package_version="$(yq -r '.version' "$package_file")"
if [[ "$package_version" != "$version" ]]; then
  echo "$app package version is $package_version, not requested release $version." >&2
  exit 1
fi

temporary_chart="$chart_file.tmp.$$"
temporary_values="$cluster_values.tmp.$$"
trap 'rm -f "$temporary_chart" "$temporary_values"' EXIT
cp "$chart_file" "$temporary_chart"
cp "$cluster_values" "$temporary_values"

yq -i ".version = \"$version\" | .appVersion = \"$version\"" "$temporary_chart"
VERSION="$version" DIGEST="$digest" yq -i '
  .image.version = strenv(VERSION) |
  .image.digest = strenv(DIGEST)
' "$temporary_values"

[[ "$(yq -r '.version' "$temporary_chart")" == "$version" ]] ||
  { echo "Failed to stage chart version $version." >&2; exit 1; }
[[ "$(yq -r '.appVersion' "$temporary_chart")" == "$version" ]] ||
  { echo "Failed to stage chart appVersion $version." >&2; exit 1; }
[[ "$(yq -r '.image.version' "$temporary_values")" == "$version" ]] ||
  { echo "Failed to stage image version $version." >&2; exit 1; }
[[ "$(yq -r '.image.digest' "$temporary_values")" == "$digest" ]] ||
  { echo "Failed to stage image digest $digest." >&2; exit 1; }

mv "$temporary_chart" "$chart_file"
mv "$temporary_values" "$cluster_values"
trap - EXIT

echo "$cluster/$app $version -> $digest"
