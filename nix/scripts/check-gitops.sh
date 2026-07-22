#!/usr/bin/env bash

set -euo pipefail

fail() {
  echo "GitOps policy check failed: $*" >&2
  exit 1
}

gitops-generate-applications --check
gitops-render

cluster_count=0
while IFS= read -r cluster_dir; do
  ((cluster_count += 1))
  applications_dir="$cluster_dir/applications"
  bootstrap_dir="$cluster_dir/bootstrap"
  cluster="$(basename "$cluster_dir")"
  cluster_namespace_count=0
  handoff_child_count=0
  root_handoff_active=false
  applications_kustomization="$applications_dir/kustomization.yaml"
  root_application="$bootstrap_dir/argocd-app-of-apps.yaml"

  [[ -f "$applications_kustomization" ]] ||
    fail "$cluster is missing applications/kustomization.yaml"
  [[ -f "$root_application" ]] ||
    fail "$cluster is missing bootstrap/argocd-app-of-apps.yaml"

  CLUSTER="$cluster" EXPECTED_PATH="gitops/clusters/$cluster/applications" yq -e '
    .apiVersion == "argoproj.io/v1alpha1" and
    .kind == "Application" and
    .metadata.name == strenv(CLUSTER) and
    .metadata.namespace == .spec.destination.namespace and
    .spec.source.path == strenv(EXPECTED_PATH) and
    .spec.source.targetRevision == "refs/heads/master" and
    (.spec.source.repoURL | test("^https://")) and
    (.spec.destination.server | test("^https://")) and
    .spec.project == "bootstrap" and
    .spec.syncPolicy.automated.enabled == true and
    (.spec.syncPolicy.automated | has("prune")) and
    .metadata.finalizers == null
  ' "$root_application" >/dev/null ||
    fail "$cluster root Application bootstrap policy is invalid"
  root_repo_url="$(yq -er '.spec.source.repoURL' "$root_application")"
  root_destination_server="$(yq -er '.spec.destination.server' "$root_application")"
  root_destination_namespace="$(yq -er '.spec.destination.namespace' "$root_application")"
  root_ownership_handoff="$(yq -r \
    '.metadata.annotations."homelab.dev/ownership-handoff" // ""' "$root_application")"
  root_prune="$(yq -r '.spec.syncPolicy.automated.prune' "$root_application")"

  if [[ "$cluster" == "hub-a" && "$root_ownership_handoff" == "root-to-child" ]]; then
    [[ "$root_prune" == "false" ]] ||
      fail "$cluster ownership handoff requires automated pruning to be disabled"
    root_handoff_active=true
  else
    [[ -z "$root_ownership_handoff" ]] ||
      fail "$cluster has an invalid root ownership-handoff marker"
    [[ "$root_prune" == "true" ]] ||
      fail "$cluster must enable automated pruning outside an ownership handoff"
  fi

  mapfile -t application_resources < <(yq -er '.resources[]' "$applications_kustomization")
  (( ${#application_resources[@]} > 0 )) ||
    fail "$cluster must declare at least one Application"

  for application_resource in "${application_resources[@]}"; do
    [[ "$application_resource" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?\.yaml$ ]] ||
      fail "$cluster Application collection contains a non-Application resource: $application_resource"
    app_file="$applications_dir/$application_resource"
    [[ -f "$app_file" ]] || fail "$cluster references missing $application_resource"
    app="$(yq -r '.metadata.name' "$app_file")"
    project="$(yq -r '.spec.project' "$app_file")"
    source_count="$(yq -r '(.spec.sources // [.spec.source]) | length' "$app_file")"

    [[ "$application_resource" == "$app.yaml" ]] ||
      fail "$cluster resource $application_resource contains Application $app"

    [[ "$project" != "default" ]] || fail "$app still uses the default AppProject"
    (( source_count <= 2 )) || fail "$app has $source_count sources; the maximum is 2"

    bad_git_revisions="$(yq -r '
      (.spec.sources // [.spec.source])[] |
      select(.repoURL | test("^https://github.com/")) |
      select(.targetRevision != "refs/heads/master") |
      .targetRevision
    ' "$app_file")"
    [[ -z "$bad_git_revisions" ]] || fail "$app has an ambiguous Git branch revision"

    if (( source_count > 1 )); then
      values_ref_count="$(yq -r '[.spec.sources[] | select(.ref == "values")] | length' "$app_file")"
      [[ "$values_ref_count" == "1" ]] ||
        fail "$app multi-source configuration must have exactly one values source"
    fi

    mapfile -t local_source_paths < <(ROOT_REPO_URL="$root_repo_url" yq -r '
      (.spec.sources // [.spec.source])[] |
      select(.repoURL == strenv(ROOT_REPO_URL) and .path != null) |
      .path
    ' "$app_file")
    for local_source_path in "${local_source_paths[@]}"; do
      [[ "$local_source_path" == gitops/* || "$local_source_path" == helm/* ]] ||
        fail "$app local source path is outside the declared deployment trees: $local_source_path"
      [[ -d "$local_source_path" ]] ||
        fail "$app local source path does not exist: $local_source_path"

      if [[ -f "$local_source_path/kustomization.yaml" ]]; then
        rendered_manifests="$(kubectl kustomize "$local_source_path")"
        rendered_namespace_count="$(yq eval-all \
          '[.] | map(select(.kind == "Namespace")) | length' \
          - <<<"$rendered_manifests")"
        (( cluster_namespace_count += rendered_namespace_count ))

        pulumi_owned_namespaces="$(yq -r '
          select(.kind == "Namespace" and .metadata.name == "argocd") |
          .metadata.name
        ' - <<<"$rendered_manifests")"
        [[ -z "$pulumi_owned_namespaces" ]] ||
          fail "Pulumi-owned argocd Namespace is rendered by $app"

        invalid_namespaces="$(yq -r '
          select(
            .kind == "Namespace" and (
              .metadata.annotations."argocd.argoproj.io/sync-wave" != "0" or
              ((.metadata.annotations."argocd.argoproj.io/sync-options" // "") | contains("ServerSideApply=true") | not) or
              ((.metadata.annotations."argocd.argoproj.io/sync-options" // "") | contains("Prune=confirm") | not) or
              ((.metadata.annotations."argocd.argoproj.io/sync-options" // "") | contains("Delete=confirm") | not) or
              .metadata.labels."app.kubernetes.io/managed-by" != "argocd"
            )
          ) |
          .metadata.name
        ' - <<<"$rendered_manifests")"
        [[ -z "$invalid_namespaces" ]] ||
          fail "$app renders unprotected managed Namespaces: $invalid_namespaces"
      fi
    done

    ownership_handoff="$(yq -r \
      '.metadata.annotations."homelab.dev/ownership-handoff" // ""' "$app_file")"
    if [[ "$root_handoff_active" == true && \
      "$app" =~ ^(cluster-foundation|argocd-config)$ ]]; then
      [[ "$ownership_handoff" == "root-to-child" ]] ||
        fail "$app must carry the root-to-child marker during the hub-a handoff"
      if yq -r '.spec.syncPolicy.syncOptions[]' "$app_file" |
        grep -Fx 'FailOnSharedResource=true' >/dev/null; then
        fail "$app must not reject shared resources during the hub-a handoff"
      fi
      ((handoff_child_count += 1))
    else
      [[ -z "$ownership_handoff" ]] ||
        fail "$app has an invalid ownership-handoff exemption"
      if ! yq -r '.spec.syncPolicy.syncOptions[]' "$app_file" |
        grep -Fx 'FailOnSharedResource=true' >/dev/null; then
        fail "$app does not reject shared-resource ownership"
      fi
    fi
    yq -e '.metadata.finalizers == null' "$app_file" >/dev/null ||
      fail "$app must retain the deliberate orphan-on-Application-deletion policy"

    if grep -Eq 'CreateNamespace=true|managedNamespaceMetadata|homelab.dev/(image|source-revision|sync-stage)' \
      "$app_file"; then
      fail "$app contains obsolete namespace or release metadata"
    fi

    case "$app" in
      cluster-foundation|argocd-config)
        [[ "$project" == "bootstrap" ]] || fail "$app must use project bootstrap"
        ;;
      dotdev-web|dotdev-studio|dotdev-labs)
        [[ "$project" == "dsqr" ]] || fail "$app must use project dsqr"
        ;;
      fidara)
        [[ "$project" == "fidara" ]] || fail "$app must use project fidara"
        ;;
      twt-web|twt-admin)
        [[ "$project" == "twt" ]] || fail "$app must use project twt"
        ;;
      *)
        [[ "$project" == "platform" ]] || fail "$app must use project platform"
        ;;
    esac
  done

  (( cluster_namespace_count > 0 )) ||
    fail "$cluster does not render any protected managed Namespaces"
  if [[ "$root_handoff_active" == true && "$handoff_child_count" != "2" ]]; then
    fail "$cluster ownership handoff must include cluster-foundation and argocd-config"
  fi

  default_project="$bootstrap_dir/default.appproject.yaml"
  [[ "$(yq -r '.metadata.name' "$default_project")" == "default" ]] ||
    fail "$cluster default AppProject has the wrong name"
  [[ "$(yq -r '.spec.sourceRepos | length' "$default_project")" == "0" ]] ||
    fail "$cluster default AppProject permits source repositories"
  [[ "$(yq -r '.spec.destinations | length' "$default_project")" == "0" ]] ||
    fail "$cluster default AppProject permits destinations"
  bootstrap_project="$bootstrap_dir/bootstrap.appproject.yaml"
  ROOT_REPO_URL="$root_repo_url" \
  ROOT_DESTINATION_SERVER="$root_destination_server" \
  ROOT_DESTINATION_NAMESPACE="$root_destination_namespace" \
    yq -e '
      .metadata.name == "bootstrap" and
      .metadata.namespace == strenv(ROOT_DESTINATION_NAMESPACE) and
      (.spec.sourceRepos | length) == 1 and
      .spec.sourceRepos[0] == strenv(ROOT_REPO_URL) and
      (.spec.destinations | length) == 1 and
      .spec.destinations[0].server == strenv(ROOT_DESTINATION_SERVER) and
      .spec.destinations[0].namespace == strenv(ROOT_DESTINATION_NAMESPACE)
    ' "$bootstrap_project" >/dev/null || fail "$cluster bootstrap AppProject is invalid"
  yq -r '.metadata.finalizers[]' "$bootstrap_project" |
    grep -Fx 'resources-finalizer.argocd.argoproj.io' >/dev/null ||
    fail "$cluster bootstrap AppProject lacks its resource finalizer"
  if yq -r '.spec.sourceRepos[]' "$bootstrap_project" | grep -Fx '*' >/dev/null; then
    fail "$cluster bootstrap AppProject contains a wildcard source"
  fi
done < <(find gitops/clusters -mindepth 1 -maxdepth 1 -type d | sort)

(( cluster_count > 0 )) || fail "no GitOps clusters are declared"

for project in dsqr fidara twt platform; do
  project_file="gitops/manifests/argocd/base/$project.appproject.yaml"
  yq -r '.metadata.finalizers[]' "$project_file" |
    grep -Fx 'resources-finalizer.argocd.argoproj.io' >/dev/null ||
    fail "$project AppProject lacks its resource finalizer"
  if yq -r '.spec.sourceRepos[]' "$project_file" | grep -Fx '*' >/dev/null; then
    fail "$project AppProject contains a wildcard source"
  fi
  if yq -r '.spec.destinations[].namespace' "$project_file" | grep -Fx '*' >/dev/null; then
    fail "$project AppProject contains a wildcard destination"
  fi
done

if rg -n 'CreateNamespace=true|managedNamespaceMetadata|targetRevision: master|values-overrides.yaml' \
  gitops; then
  fail "obsolete GitOps configuration remains"
fi

# A broken cluster declaration must fail before touching any generated output.
atomic_root="$(mktemp -d)"
trap 'rm -rf "$atomic_root"' EXIT
mkdir -p "$atomic_root/repo"
cp -R gitops "$atomic_root/repo/gitops"
atomic_cluster_dir="$(find "$atomic_root/repo/gitops/clusters" \
  -mindepth 1 -maxdepth 1 -type d | sort | head -n 1)"
[[ -n "$atomic_cluster_dir" ]] || fail "atomic generator test found no cluster"
yq -i '.resources += ["missing-template.yaml"]' \
  "$atomic_cluster_dir/applications/kustomization.yaml"
cp -R "$atomic_cluster_dir/applications" "$atomic_root/before"
if gitops-generate-applications --repo-root "$atomic_root/repo" >/dev/null 2>&1; then
  fail "generator accepted an application without a template"
fi
diff -ru "$atomic_root/before" "$atomic_cluster_dir/applications" >/dev/null ||
  fail "failed generation partially changed committed cluster output"

echo "GitOps generation, rendering, ownership, and policy checks passed."
