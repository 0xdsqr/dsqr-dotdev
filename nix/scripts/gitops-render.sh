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

while IFS= read -r config_file; do
  cluster_dir="$(dirname "$config_file")"
  kubectl kustomize "$cluster_dir/bootstrap" >/dev/null
  kubectl kustomize "$cluster_dir/applications" >/dev/null
done < <(find "$repo_root/gitops/clusters" -mindepth 2 -maxdepth 2 -name config.yaml -type f | sort)

while IFS= read -r kustomization; do
  kubectl kustomize "$(dirname "$kustomization")" >/dev/null
done < <(find "$repo_root/gitops/manifests" -path '*/overlays/*/kustomization.yaml' -type f | sort)

echo "All GitOps clusters and manifest overlays render successfully."
