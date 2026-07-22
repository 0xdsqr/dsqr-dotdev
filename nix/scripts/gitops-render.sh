#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  gitops-render [--repo-root PATH]

Renders every cluster bootstrap and Application collection, plus every
Kustomize overlay. Output is discarded by default; the command succeeds only
when every declared GitOps surface renders successfully.
EOF
}

repo_root="$PWD"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-root)
      if [[ $# -lt 2 ]]; then
        echo "--repo-root requires a path" >&2
        exit 2
      fi
      repo_root="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

repo_root="$(cd "$repo_root" && pwd)"
clusters_root="$repo_root/gitops/clusters"
manifests_root="$repo_root/gitops/manifests"

if [[ ! -d "$clusters_root" || ! -d "$manifests_root" ]]; then
  echo "Expected gitops/clusters and gitops/manifests under $repo_root" >&2
  exit 1
fi

cluster_count=0
while IFS= read -r cluster_dir; do
  ((cluster_count += 1))
  kubectl kustomize "$cluster_dir/bootstrap" >/dev/null
  kubectl kustomize "$cluster_dir/applications" >/dev/null
done < <(find "$clusters_root" -mindepth 1 -maxdepth 1 -type d | sort)

if (( cluster_count == 0 )); then
  echo "No GitOps clusters are declared under $clusters_root" >&2
  exit 1
fi

overlay_count=0
while IFS= read -r kustomization; do
  ((overlay_count += 1))
  kubectl kustomize "$(dirname "$kustomization")" >/dev/null
done < <(find "$manifests_root" -path '*/overlays/*/kustomization.yaml' -type f | sort)

if (( overlay_count == 0 )); then
  echo "No GitOps manifest overlays are declared under $manifests_root" >&2
  exit 1
fi

echo "All GitOps clusters and manifest overlays render successfully."
