#!/usr/bin/env bash

set -euo pipefail

readonly release_name="argocd"
readonly release_namespace="argocd"
readonly tracking_annotation="argocd.argoproj.io/tracking-id"

mode="dry-run"

usage() {
  cat <<'EOF'
Usage: gitops-cleanup-tracking [--apply]

Safely removes stale `argocd:` resource-tracking annotations left by the
retired self-managing Argo CD Application.

The default is a read-only dry run. Pass --apply to remove only the tracking
annotation from resources that are both:

  1. present in the deployed `argocd` Helm release manifest; and
  2. annotated as owned by Helm release `argocd` in namespace `argocd`.

This command never deletes resources.
EOF
}

fail() {
  echo "Argo CD tracking cleanup refused: $*" >&2
  exit 1
}

ensure_self_managing_application_absent() {
  local application
  application="$(
    kubectl --namespace "$release_namespace" get applications.argoproj.io \
      "$release_name" --ignore-not-found --output name
  )"
  [[ -z "$application" ]] ||
    fail "Application/$release_name still exists in namespace $release_namespace"
}

while (( $# > 0 )); do
  case "$1" in
    --apply)
      [[ "$mode" == "dry-run" ]] || fail "--apply may be passed only once"
      mode="apply"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      usage >&2
      fail "unknown argument: $1"
      ;;
  esac
  shift
done

ensure_self_managing_application_absent

release_status="$(
  helm status "$release_name" --namespace "$release_namespace" --output json
)"
jq -e \
  --arg release "$release_name" \
  --arg namespace "$release_namespace" '
    .name == $release and
    .namespace == $namespace and
    .info.status == "deployed"
  ' <<<"$release_status" >/dev/null ||
  fail "Helm release $release_namespace/$release_name is not deployed"

work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT
manifest_file="$work_dir/manifest.yaml"
resources_file="$work_dir/resources.tsv"
plan_file="$work_dir/plan.tsv"
: >"$plan_file"

helm get manifest "$release_name" --namespace "$release_namespace" >"$manifest_file"

yq eval --no-doc '
  select(
    .apiVersion != null and
    .kind != null and
    .metadata.name != null
  ) |
  [
    .apiVersion,
    .kind,
    (.metadata.namespace // ""),
    .metadata.name
  ] |
  join("|")
' "$manifest_file" | sort -u >"$resources_file"

[[ -s "$resources_file" ]] ||
  fail "the deployed Helm release manifest contains no resources"

planned=0
skipped_unverified=0

while IFS='|' read -r expected_api_version expected_kind expected_namespace expected_name; do
  [[ -n "$expected_api_version" && -n "$expected_kind" && -n "$expected_name" ]] ||
    fail "the Helm release manifest produced an incomplete resource identity"

  get_resource=(kubectl)
  if [[ -n "$expected_namespace" ]]; then
    get_resource+=(--namespace "$expected_namespace")
  fi
  get_resource+=(
    get "$expected_kind" "$expected_name"
    --ignore-not-found
    --output 'jsonpath={.apiVersion}{"|"}{.kind}{"|"}{.metadata.namespace}{"|"}{.metadata.name}{"|"}{.metadata.annotations.meta\.helm\.sh/release-name}{"|"}{.metadata.annotations.meta\.helm\.sh/release-namespace}{"|"}{.metadata.annotations.argocd\.argoproj\.io/tracking-id}{"\n"}'
  )

  live_identity="$("${get_resource[@]}")"
  [[ -n "$live_identity" ]] || continue

  IFS='|' read -r \
    live_api_version \
    live_kind \
    live_namespace \
    live_name \
    live_release_name \
    live_release_namespace \
    live_tracking_id <<<"$live_identity"

  [[ "$live_api_version" == "$expected_api_version" ]] ||
    fail "$expected_kind/$expected_name resolved to unexpected API version $live_api_version"
  [[ "$live_kind" == "$expected_kind" ]] ||
    fail "$expected_kind/$expected_name resolved to unexpected kind $live_kind"
  [[ "$live_name" == "$expected_name" ]] ||
    fail "$expected_kind/$expected_name resolved to unexpected name $live_name"
  [[ "$live_namespace" == "$expected_namespace" ]] ||
    fail "$expected_kind/$expected_name resolved to unexpected namespace $live_namespace"

  [[ "$live_tracking_id" == argocd:* ]] || continue

  if [[ "$live_release_name" != "$release_name" ||
    "$live_release_namespace" != "$release_namespace" ]]; then
    echo "SKIP unverified Helm ownership: $live_kind ${live_namespace:-<cluster>}/$live_name" >&2
    ((skipped_unverified += 1))
    continue
  fi

  ((planned += 1))
  printf '%s|%s|%s|%s\n' \
    "$live_kind" "$live_namespace" "$live_name" "$live_tracking_id" >>"$plan_file"
done <"$resources_file"

if (( skipped_unverified > 0 )); then
  fail "$skipped_unverified stale annotations did not have exact Helm ownership metadata"
fi

if [[ "$mode" == "apply" ]]; then
  # Close the discovery/apply race before performing any mutations.
  ensure_self_managing_application_absent
fi

while IFS='|' read -r live_kind live_namespace live_name live_tracking_id; do
  [[ -n "$live_kind" && -n "$live_name" && "$live_tracking_id" == argocd:* ]] ||
    fail "the validated cleanup plan contains an invalid resource"
  resource_display="$live_kind ${live_namespace:-<cluster>}/$live_name"

  if [[ "$mode" == "dry-run" ]]; then
    echo "DRY-RUN remove $tracking_annotation=$live_tracking_id from $resource_display"
    continue
  fi

  annotate_resource=(kubectl)
  if [[ -n "$live_namespace" ]]; then
    annotate_resource+=(--namespace "$live_namespace")
  fi
  annotate_resource+=(
    annotate "$live_kind" "$live_name"
    "$tracking_annotation-"
  )
  "${annotate_resource[@]}"
done <"$plan_file"

if [[ "$mode" == "dry-run" ]]; then
  echo "Dry run complete: $planned stale tracking annotations are eligible for removal."
  if (( planned > 0 )); then
    echo "Review the list, then rerun with --apply to remove annotations only."
  fi
else
  echo "Cleanup complete: removed $planned stale tracking annotations; no resources were deleted."
fi
