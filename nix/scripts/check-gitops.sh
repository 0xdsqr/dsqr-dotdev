#!/usr/bin/env bash

set -euo pipefail

fail() {
  echo "GitOps policy check failed: $*" >&2
  exit 1
}

gitops-generate-applications --check
gitops-render

while IFS= read -r config_file; do
  cluster_dir="$(dirname "$config_file")"
  applications_dir="$cluster_dir/applications"
  bootstrap_dir="$cluster_dir/bootstrap"
  cluster="$(basename "$cluster_dir")"

  [[ "$(yq -r '.cluster.name' "$config_file")" == "$cluster" ]] ||
    fail "$config_file cluster.name must match its directory"
  [[ "$(yq -r '.source.targetRevision' "$config_file")" == "refs/heads/master" ]] ||
    fail "$config_file must use the fully qualified master branch ref"

  while IFS= read -r app_file; do
    app="$(yq -r '.metadata.name' "$app_file")"
    project="$(yq -r '.spec.project' "$app_file")"
    source_count="$(yq -r '(.spec.sources // [.spec.source]) | length' "$app_file")"

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

    if ! yq -r '.spec.syncPolicy.syncOptions[]' "$app_file" |
      grep -Fxq 'FailOnSharedResource=true'; then
      fail "$app does not reject shared-resource ownership"
    fi
    yq -e '.metadata.finalizers == null' "$app_file" >/dev/null ||
      fail "$app must retain the deliberate orphan-on-Application-deletion policy"

    if grep -Eq 'CreateNamespace=true|managedNamespaceMetadata|homelab.dev/(image|source-revision|sync-stage)' \
      "$app_file"; then
      fail "$app contains obsolete namespace or release metadata"
    fi

    case "$app" in
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
  done < <(find "$applications_dir" -maxdepth 1 -type f -name '*.yaml' \
    ! -name kustomization.yaml ! -name namespaces.yaml | sort)

  namespace_count="$(yq eval-all '[.] | length' "$applications_dir/namespaces.yaml")"
  [[ "$namespace_count" == "7" ]] || fail "$cluster must declare exactly 7 managed Namespaces"
  while IFS= read -r namespace; do
    [[ "$namespace" != "argocd" ]] || fail "Pulumi-owned argocd Namespace is declared in GitOps"
  done < <(yq -r '.metadata.name' "$applications_dir/namespaces.yaml")
  invalid_namespaces="$(yq -r '
    select(
      .kind != "Namespace" or
      .metadata.annotations."argocd.argoproj.io/sync-wave" != "0" or
      (.metadata.annotations."argocd.argoproj.io/sync-options" | contains("ServerSideApply=true") | not) or
      (.metadata.annotations."argocd.argoproj.io/sync-options" | contains("Prune=confirm") | not) or
      (.metadata.annotations."argocd.argoproj.io/sync-options" | contains("Delete=confirm") | not)
    ) |
    .metadata.name
  ' "$applications_dir/namespaces.yaml")"
  [[ -z "$invalid_namespaces" ]] || fail "$cluster has unprotected managed Namespaces: $invalid_namespaces"

  yq -e '
    .spec.project == "bootstrap" and
    .spec.source.targetRevision == "refs/heads/master" and
    .metadata.finalizers == null
  ' "$bootstrap_dir/argocd-app-of-apps.yaml" >/dev/null ||
    fail "$cluster root Application bootstrap policy is invalid"
  default_project="$bootstrap_dir/default.appproject.yaml"
  [[ "$(yq -r '.metadata.name' "$default_project")" == "default" ]] ||
    fail "$cluster default AppProject has the wrong name"
  [[ "$(yq -r '.spec.sourceRepos | length' "$default_project")" == "0" ]] ||
    fail "$cluster default AppProject permits source repositories"
  [[ "$(yq -r '.spec.destinations | length' "$default_project")" == "0" ]] ||
    fail "$cluster default AppProject permits destinations"
  bootstrap_project="$bootstrap_dir/bootstrap.appproject.yaml"
  yq -e '.metadata.name == "bootstrap" and ([.spec.destinations[] | select(.namespace == "argocd")] | length == 1)' \
    "$bootstrap_project" >/dev/null || fail "$cluster bootstrap AppProject is invalid"
  yq -r '.metadata.finalizers[]' "$bootstrap_project" |
    grep -Fxq 'resources-finalizer.argocd.argoproj.io' ||
    fail "$cluster bootstrap AppProject lacks its resource finalizer"
  if yq -r '.spec.sourceRepos[]' "$bootstrap_project" | grep -Fxq '*'; then
    fail "$cluster bootstrap AppProject contains a wildcard source"
  fi
done < <(find gitops/clusters -mindepth 2 -maxdepth 2 -type f -name config.yaml | sort)

for project in dsqr fidara twt platform; do
  project_file="gitops/manifests/argocd/base/$project.appproject.yaml"
  yq -r '.metadata.finalizers[]' "$project_file" |
    grep -Fxq 'resources-finalizer.argocd.argoproj.io' ||
    fail "$project AppProject lacks its resource finalizer"
  if yq -r '.spec.sourceRepos[]' "$project_file" | grep -Fxq '*'; then
    fail "$project AppProject contains a wildcard source"
  fi
  if yq -r '.spec.destinations[].namespace' "$project_file" | grep -Fxq '*'; then
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
cp -R "$atomic_root/repo/gitops/clusters/hub-a/applications" "$atomic_root/before"
yq -i '.applications += ["missing-template"]' \
  "$atomic_root/repo/gitops/clusters/hub-a/config.yaml"
if gitops-generate-applications --repo-root "$atomic_root/repo" >/dev/null 2>&1; then
  fail "generator accepted an application without a template"
fi
diff -ru "$atomic_root/before" "$atomic_root/repo/gitops/clusters/hub-a/applications" >/dev/null ||
  fail "failed generation partially changed committed cluster output"

echo "GitOps generation, rendering, ownership, and policy checks passed."
