#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  release-verify-candidates [options]

Options:
  --base-revision <revision>  Trusted release source revision. Defaults to
                              RELEASE_BASE_REVISION or the merge base with
                              RELEASE_BASE_REF (origin/master).
  --head-revision <revision>  Release pull request revision. Defaults to
                              RELEASE_HEAD_REVISION or HEAD.
  --cluster <cluster>         GitOps promotion cluster (default: hub-a).
  --registry <registry>       Container registry (default: ghcr.io).
  --owner <owner>             Registry owner. Defaults to
                              RELEASE_REGISTRY_OWNER or
                              GITHUB_REPOSITORY_OWNER.

For every application version changed between the base and head revisions,
the verifier requires the package, chart, and GitOps promotion versions to
agree. It then proves that the promoted digest is the digest of the trusted
candidate image produced from the base revision.
EOF
}

base_revision="${RELEASE_BASE_REVISION:-}"
base_ref="${RELEASE_BASE_REF:-origin/master}"
head_revision="${RELEASE_HEAD_REVISION:-HEAD}"
cluster="${RELEASE_CLUSTER:-hub-a}"
registry="${RELEASE_REGISTRY:-ghcr.io}"
owner="${RELEASE_REGISTRY_OWNER:-${GITHUB_REPOSITORY_OWNER:-}}"
skopeo_bin="${RELEASE_SKOPEO_BIN:-skopeo}"
attestation_repository="${RELEASE_ATTESTATION_REPOSITORY:-${GITHUB_REPOSITORY:-}}"
attestation_verify_bin="${RELEASE_ATTESTATION_VERIFY_BIN:-gh}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-revision)
      base_revision="${2:-}"
      shift 2
      ;;
    --head-revision)
      head_revision="${2:-}"
      shift 2
      ;;
    --cluster)
      cluster="${2:-}"
      shift 2
      ;;
    --registry)
      registry="${2:-}"
      shift 2
      ;;
    --owner)
      owner="${2:-}"
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

if [[ ! "$cluster" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]]; then
  echo "Cluster '$cluster' is not a valid DNS label." >&2
  exit 2
fi
if [[ ! "$registry" =~ ^[a-z0-9.-]+(:[0-9]+)?$ ]]; then
  echo "Registry '$registry' is not a valid registry host." >&2
  exit 2
fi
if [[ ! "$owner" =~ ^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?$ ]]; then
  echo "RELEASE_REGISTRY_OWNER, GITHUB_REPOSITORY_OWNER, or --owner is required." >&2
  exit 2
fi

resolve_commit() {
  local revision="$1"
  local label="$2"
  local resolved

  if ! resolved="$(git rev-parse --verify "$revision^{commit}" 2>/dev/null)"; then
    echo "$label '$revision' does not resolve to a Git commit." >&2
    exit 1
  fi
  if [[ ! "$resolved" =~ ^[0-9a-f]{40}$ ]]; then
    echo "$label '$revision' resolved to an invalid commit id: $resolved" >&2
    exit 1
  fi

  printf '%s\n' "$resolved"
}

head_sha="$(resolve_commit "$head_revision" "Head revision")"
if [[ -n "$base_revision" ]]; then
  base_sha="$(resolve_commit "$base_revision" "Base revision")"
else
  base_ref_sha="$(resolve_commit "$base_ref" "Base ref")"
  if ! base_sha="$(git merge-base "$base_ref_sha" "$head_sha")"; then
    echo "Could not find a merge base between $base_ref and $head_sha." >&2
    exit 1
  fi
fi

if [[ ! "$base_sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Derived base revision is not a full lowercase Git commit: $base_sha" >&2
  exit 1
fi
if ! git merge-base --is-ancestor "$base_sha" "$head_sha"; then
  echo "Base revision $base_sha is not an ancestor of head revision $head_sha." >&2
  exit 1
fi

version_at() {
  local revision="$1"
  local package_file="$2"
  git show "$revision:$package_file" | jq -er '.version | select(type == "string" and length > 0)'
}

yaml_at() {
  local revision="$1"
  local file="$2"
  local expression="$3"
  git show "$revision:$file" | yq -er "$expression"
}

verified_count=0

verify_app() {
  local app="$1"
  local package_file="$2"
  local chart_file="$3"
  local production_values_file="$4"
  local chart_directory
  local promotion_directory="gitops/values/$app"
  local cluster_values_file="gitops/values/$app/$cluster.yaml"
  local cluster_applications="gitops/clusters/$cluster/applications/kustomization.yaml"
  local previous_version
  local version
  local chart_version
  local app_version
  local promoted_version
  local promoted_digest
  local repository
  local expected_repository
  local version_tag
  local candidate
  local candidate_digest
  local signer_workflow

  previous_version="$(version_at "$base_sha" "$package_file")"
  version="$(version_at "$head_sha" "$package_file")"
  if [[ "$previous_version" == "$version" ]]; then
    chart_directory="$(dirname "$chart_file")"
    if ! git diff --quiet "$base_sha" "$head_sha" -- \
      "$chart_directory" \
      "$promotion_directory"; then
      echo "$app release-managed chart or promotion values changed without a package version bump." >&2
      exit 1
    fi
    return 0
  fi

  if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$ ]]; then
    echo "$app package version is not valid SemVer: $version" >&2
    exit 1
  fi

  if ! git show "$head_sha:$cluster_applications" |
    APPLICATION_RESOURCE="$app.yaml" yq -e \
      '.resources[] | select(. == strenv(APPLICATION_RESOURCE))' >/dev/null; then
    echo "Application '$app' is not enabled for cluster '$cluster' at $head_sha." >&2
    exit 1
  fi

  chart_version="$(yaml_at "$head_sha" "$chart_file" '.version')"
  app_version="$(yaml_at "$head_sha" "$chart_file" '.appVersion')"
  promoted_version="$(yaml_at "$head_sha" "$cluster_values_file" '.image.version')"
  promoted_digest="$(yaml_at "$head_sha" "$cluster_values_file" '.image.digest')"
  repository="$(yaml_at "$head_sha" "$production_values_file" '.image.repository')"
  expected_repository="$registry/$owner/$app"

  if [[ "$chart_version" != "$version" || "$app_version" != "$version" || "$promoted_version" != "$version" ]]; then
    echo "$app package, chart, app, and $cluster promotion versions must agree at $version." >&2
    exit 1
  fi
  if [[ ! "$promoted_digest" =~ ^sha256:[0-9a-f]{64}$ ]]; then
    echo "$app has an invalid promoted digest: $promoted_digest" >&2
    exit 1
  fi
  if [[ "$repository" != "$expected_repository" ]]; then
    echo "$app repository is $repository; expected $expected_repository." >&2
    exit 1
  fi

  version_tag="${version//+/-}"
  candidate="$repository:candidate-$version_tag-$base_sha"
  if ! candidate_digest="$("$skopeo_bin" inspect --format '{{.Digest}}' "docker://$candidate")"; then
    echo "Could not inspect trusted release candidate $candidate." >&2
    exit 1
  fi
  if [[ ! "$candidate_digest" =~ ^sha256:[0-9a-f]{64}$ ]]; then
    echo "$candidate returned an invalid registry digest: $candidate_digest" >&2
    exit 1
  fi
  if [[ "$candidate_digest" != "$promoted_digest" ]]; then
    echo "$app promotion digest is $promoted_digest; trusted candidate $candidate resolves to $candidate_digest." >&2
    exit 1
  fi

  if [[ -n "$attestation_repository" ]]; then
    signer_workflow="$attestation_repository/.github/workflows/release.yml"
    "$attestation_verify_bin" attestation verify \
      "oci://$repository@$candidate_digest" \
      --bundle-from-oci \
      --repo "$attestation_repository" \
      --signer-workflow "$signer_workflow" \
      --source-digest "$base_sha" >/dev/null
    "$attestation_verify_bin" attestation verify \
      "oci://$repository@$candidate_digest" \
      --bundle-from-oci \
      --repo "$attestation_repository" \
      --signer-workflow "$signer_workflow" \
      --source-digest "$base_sha" \
      --predicate-type https://spdx.dev/Document/v2.3 >/dev/null
  elif [[ "${GITHUB_ACTIONS:-}" == "true" ]]; then
    echo "GITHUB_REPOSITORY or RELEASE_ATTESTATION_REPOSITORY is required in CI." >&2
    exit 1
  else
    echo "Skipping signed attestation verification outside CI; no repository identity was supplied."
  fi

  verified_count=$((verified_count + 1))
  echo "$cluster/$app $version candidate, provenance, and SBOM verified at $candidate_digest from $base_sha"
}

verify_app dotdev-web apps/dotdev/package.json helm/dotdev-web/Chart.yaml \
  helm/dotdev-web/values-prod.yaml
verify_app dotdev-studio apps/studio/package.json helm/dotdev-studio/Chart.yaml \
  helm/dotdev-studio/values-prod.yaml
verify_app dotdev-labs apps/labs/package.json helm/dotdev-labs/Chart.yaml \
  helm/dotdev-labs/values-prod.yaml

if [[ "$verified_count" == "0" ]]; then
  echo "No application versions changed between $base_sha and $head_sha; unchanged application chart and promotion surfaces are valid."
  exit 0
fi

echo "Verified $verified_count trusted release candidate(s)."
