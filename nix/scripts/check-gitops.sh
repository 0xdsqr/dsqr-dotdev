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
    .spec.syncPolicy.automated.prune == true and
    .metadata.annotations."homelab.dev/ownership-handoff" == null and
    .metadata.finalizers == null
  ' "$root_application" >/dev/null ||
    fail "$cluster root Application bootstrap policy is invalid"
  root_repo_url="$(yq -er '.spec.source.repoURL' "$root_application")"
  root_destination_server="$(yq -er '.spec.destination.server' "$root_application")"
  root_destination_namespace="$(yq -er '.spec.destination.namespace' "$root_application")"

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

    [[ "$(yq -r '.metadata.annotations."homelab.dev/ownership-handoff" // ""' \
      "$app_file")" == "" ]] || fail "$app has an ownership-handoff exemption"
    if ! yq -r '.spec.syncPolicy.syncOptions[]' "$app_file" |
      grep -Fx 'FailOnSharedResource=true' >/dev/null; then
      fail "$app does not reject shared-resource ownership"
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
        yq -e '
          (.spec.sources | length) == 2 and
          .spec.sources[0].ref == null and
          .spec.sources[1].ref == "values" and
          .spec.sources[1].path == null and
          .spec.sources[1].chart == null and
          .spec.sources[1].helm == null
        ' "$app_file" >/dev/null ||
          fail "$app values source must not render trusted-repository manifests"
        ;;
      fidara)
        [[ "$project" == "fidara" ]] || fail "$app must use project fidara"
        yq -e '
          (.spec.sources | length) == 2 and
          .spec.sources[0].ref == null and
          .spec.sources[1].ref == "values" and
          .spec.sources[1].path == null and
          .spec.sources[1].chart == null and
          .spec.sources[1].helm == null
        ' "$app_file" >/dev/null ||
          fail "$app values source must not render trusted-repository manifests"
        ;;
      twt-web|twt-admin)
        [[ "$project" == "twt" ]] || fail "$app must use project twt"
        yq -e '
          (.spec.sources | length) == 2 and
          .spec.sources[0].ref == null and
          .spec.sources[1].ref == "values" and
          .spec.sources[1].path == null and
          .spec.sources[1].chart == null and
          .spec.sources[1].helm == null
        ' "$app_file" >/dev/null ||
          fail "$app values source must not render trusted-repository manifests"
        ;;
      cilium|external-secrets|k8s-monitoring|kube-state-metrics|metallb|metallb-config|metrics-server|traefik)
        expected_project="platform-$app"
        [[ "$project" == "$expected_project" ]] ||
          fail "$app must use its dedicated $expected_project AppProject"
        project_file="gitops/manifests/argocd/base/$expected_project.appproject.yaml"
        [[ -f "$project_file" ]] ||
          fail "$app references missing AppProject $expected_project"

        application_sources="$(
          yq -r '(.spec.sources // [.spec.source])[].repoURL' "$app_file" |
            sort -u
        )"
        project_sources="$(yq -r '.spec.sourceRepos[]' "$project_file" | sort -u)"
        [[ "$application_sources" == "$project_sources" ]] ||
          fail "$expected_project permits sources other than those used by $app"

        expected_destinations="$(
          yq -r '[.spec.destination.server, .spec.destination.namespace] | @tsv' "$app_file"
          if [[ "$app" == "cilium" ]]; then
            printf 'https://kubernetes.default.svc\tcilium-secrets\n'
          fi
        )"
        expected_destinations="$(sort -u <<<"$expected_destinations")"
        project_destinations="$(
          yq -r '.spec.destinations[] | [.server, .namespace] | @tsv' "$project_file" |
            sort -u
        )"
        [[ "$expected_destinations" == "$project_destinations" ]] ||
          fail "$expected_project permits destinations other than those used by $app"
        ;;
      external-secrets-config)
        [[ "$project" == "secrets" ]] || fail "$app must use project secrets"
        ROOT_REPO_URL="$root_repo_url" \
        EXPECTED_PATH="gitops/manifests/external-secrets-config/overlays/$cluster" \
          yq -e '
            .spec.sources == null and
            .spec.source.repoURL == strenv(ROOT_REPO_URL) and
            .spec.source.targetRevision == "refs/heads/master" and
            .spec.source.path == strenv(EXPECTED_PATH) and
            .spec.destination.server == "https://kubernetes.default.svc" and
            .spec.destination.namespace == "external-secrets"
          ' "$app_file" >/dev/null ||
          fail "$app must use its exact trusted single-source configuration"
        ;;
      *)
        fail "$app has no explicit AppProject policy"
        ;;
    esac
  done

  (( cluster_namespace_count > 0 )) ||
    fail "$cluster does not render any protected managed Namespaces"

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
      (.spec.destinations | length) >= 1 and
      .spec.destinations[0].server == strenv(ROOT_DESTINATION_SERVER) and
      .spec.destinations[0].namespace == strenv(ROOT_DESTINATION_NAMESPACE)
    ' "$bootstrap_project" >/dev/null || fail "$cluster bootstrap AppProject is invalid"
  while IFS=$'\t' read -r destination_server destination_namespace; do
    [[ "$destination_server" == "$root_destination_server" ]] ||
      fail "$cluster bootstrap AppProject contains an invalid server: $destination_server"
    [[ -n "$destination_namespace" && "$destination_namespace" != "*" ]] ||
      fail "$cluster bootstrap AppProject contains an invalid namespace: $destination_namespace"
  done < <(yq -r '.spec.destinations[] | [.server, .namespace] | @tsv' "$bootstrap_project")
  yq -r '.metadata.finalizers[]' "$bootstrap_project" |
    grep -Fx 'resources-finalizer.argocd.argoproj.io' >/dev/null ||
    fail "$cluster bootstrap AppProject lacks its resource finalizer"
  if yq -r '.spec.sourceRepos[]' "$bootstrap_project" | grep -Fx '*' >/dev/null; then
    fail "$cluster bootstrap AppProject contains a wildcard source"
  fi
done < <(find gitops/clusters -mindepth 1 -maxdepth 1 -type d | sort)

(( cluster_count > 0 )) || fail "no GitOps clusters are declared"

platform_projects=(
  platform-cilium
  platform-external-secrets
  platform-k8s-monitoring
  platform-kube-state-metrics
  platform-metallb
  platform-metallb-config
  platform-metrics-server
  platform-traefik
)

[[ ! -e gitops/manifests/argocd/base/platform.appproject.yaml ]] ||
  fail "the broad platform AppProject must remain removed"

for project in dsqr fidara twt secrets "${platform_projects[@]}"; do
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
  if [[ "$project" =~ ^(dsqr|fidara|twt)$ ]]; then
    yq -e '
      [.spec.namespaceResourceWhitelist[] |
        select(.group == "external-secrets.io" and .kind == "ExternalSecret")
      ] | length == 0
    ' "$project_file" >/dev/null ||
      fail "$project AppProject permits workload-owned ExternalSecret resources"
  fi
  if [[ "$project" == platform-* ]]; then
    yq -e '
      ([.spec.clusterResourceWhitelist[]? |
        select(
          .name == null or
          .name == "" or
          (.name | test("^\\*$")) or
          (.group | test("^\\*$")) or
          (.kind | test("^\\*$"))
        )
      ] | length) == 0 and
      ([.spec.namespaceResourceWhitelist[]? |
        select(
          (.group | test("^\\*$")) or
          (.kind | test("^\\*$"))
        )
      ] | length) == 0 and
      ([.spec.destinations[] |
        select(.namespace == "dsqr" or .namespace == "fidara" or .namespace == "twt")
      ] | length) == 0 and
      ([.spec.clusterResourceWhitelist[]? |
        select(
          .group == "external-secrets.io" and
          (.kind == "ClusterExternalSecret" or .kind == "ClusterSecretStore")
        )
      ] | length) == 0 and
      ([.spec.namespaceResourceWhitelist[]? |
        select(
          (.group == "external-secrets.io" and .kind == "ExternalSecret") or
          (.group == "generators.external-secrets.io" and .kind == "VaultDynamicSecret")
        )
      ] | length) == 0
    ' "$project_file" >/dev/null ||
      fail "$project has unnamed cluster permissions or crosses the secret-management boundary"
  fi
done

yq -e '
  ([.spec.destinations[] |
    select(
      .server == "https://kubernetes.default.svc" and
      .namespace == "cilium-secrets"
    )] | length) == 1 and
  ([.spec.clusterResourceWhitelist[] |
    select(
      .group == "" and
      .kind == "Namespace" and
      .name == "cilium-secrets"
    )] | length) == 1
' gitops/manifests/argocd/base/platform-cilium.appproject.yaml >/dev/null ||
  fail "platform-cilium does not narrowly permit Cilium TLS resources in cilium-secrets"

yq -e '
  (.spec.sourceRepos | length) == 1 and
  .spec.sourceRepos[0] == "https://github.com/0xdsqr/dsqr-dotdev.git" and
  (.spec.destinations | length) == 5 and
  .spec.destinations[0].server == "https://kubernetes.default.svc" and
  .spec.destinations[0].namespace == "external-secrets" and
  .spec.destinations[1].server == "https://kubernetes.default.svc" and
  .spec.destinations[1].namespace == "dsqr" and
  .spec.destinations[2].server == "https://kubernetes.default.svc" and
  .spec.destinations[2].namespace == "fidara" and
  .spec.destinations[3].server == "https://kubernetes.default.svc" and
  .spec.destinations[3].namespace == "twt" and
  .spec.destinations[4].server == "https://kubernetes.default.svc" and
  .spec.destinations[4].namespace == "traefik" and
  (.spec.clusterResourceWhitelist | length) == 2 and
  .spec.clusterResourceWhitelist[0].group == "external-secrets.io" and
  .spec.clusterResourceWhitelist[0].kind == "ClusterExternalSecret" and
  .spec.clusterResourceWhitelist[0].name == "ghcr-creds" and
  .spec.clusterResourceWhitelist[1].group == "external-secrets.io" and
  .spec.clusterResourceWhitelist[1].kind == "ClusterSecretStore" and
  .spec.clusterResourceWhitelist[1].name == "vault-hub-a" and
  (.spec.namespaceResourceWhitelist | length) == 3 and
  .spec.namespaceResourceWhitelist[0].group == "" and
  .spec.namespaceResourceWhitelist[0].kind == "ConfigMap" and
  .spec.namespaceResourceWhitelist[1].group == "external-secrets.io" and
  .spec.namespaceResourceWhitelist[1].kind == "ExternalSecret" and
  .spec.namespaceResourceWhitelist[2].group == "generators.external-secrets.io" and
  .spec.namespaceResourceWhitelist[2].kind == "VaultDynamicSecret"
' gitops/manifests/argocd/base/secrets.appproject.yaml >/dev/null ||
  fail "secrets AppProject is broader than its exact trusted resources"

if kubectl kustomize gitops/manifests/traefik/overlays/hub-a |
  yq eval -r '.kind' - |
  grep -E '^(ExternalSecret|VaultDynamicSecret)$' >/dev/null; then
  fail "Traefik platform application still renders Vault-backed secret resources"
fi

centralized_external_secrets="$(
  kubectl kustomize gitops/manifests/external-secrets-config/overlays/hub-a |
    yq eval -r '
      select(.kind == "ExternalSecret") |
      [
        .metadata.name,
        .metadata.namespace,
        .metadata.annotations."argocd.argoproj.io/sync-wave",
        (.spec.secretStoreRef.kind // "-"),
        (.spec.secretStoreRef.name // "-")
      ] |
      @tsv
    ' - |
    grep -v '^[[:space:]]*$' |
    sort
)"
expected_external_secrets="$(
  {
    printf 'dotdev-studio-secrets\tdsqr\t1\tClusterSecretStore\tvault-hub-a\n'
    printf 'dotdev-web-secrets\tdsqr\t1\tClusterSecretStore\tvault-hub-a\n'
    printf 'fidara-api-secrets\tfidara\t1\tClusterSecretStore\tvault-hub-a\n'
    printf 'fidara-web-secrets\tfidara\t1\tClusterSecretStore\tvault-hub-a\n'
    printf 'hub-a-traefik-origin\ttraefik\t2\t-\t-\n'
    printf 'twt-admin-secrets\ttwt\t1\tClusterSecretStore\tvault-hub-a\n'
    printf 'twt-web-secrets\ttwt\t1\tClusterSecretStore\tvault-hub-a\n'
  } | sort
)"
[[ "$centralized_external_secrets" == "$expected_external_secrets" ]] ||
  fail "trusted ExternalSecret ownership or namespace declarations are incomplete"

kubectl kustomize gitops/manifests/external-secrets-config/overlays/hub-a |
  yq eval -e '
    select(
      .apiVersion == "external-secrets.io/v1" and
      .kind == "ExternalSecret" and
      .metadata.name == "hub-a-traefik-origin" and
      .metadata.namespace == "traefik" and
      .spec.target.name == "hub-a-traefik-origin-tls" and
      .spec.target.template.type == "kubernetes.io/tls" and
      .spec.dataFrom[0].sourceRef.generatorRef.apiVersion ==
        "generators.external-secrets.io/v1alpha1" and
      .spec.dataFrom[0].sourceRef.generatorRef.kind == "VaultDynamicSecret" and
      .spec.dataFrom[0].sourceRef.generatorRef.name == "hub-a-traefik-origin"
    )
  ' - >/dev/null ||
  fail "trusted Traefik ExternalSecret target or generator reference is incomplete"

kubectl kustomize gitops/manifests/external-secrets-config/overlays/hub-a |
  yq eval -e '
    select(
      .apiVersion == "generators.external-secrets.io/v1alpha1" and
      .kind == "VaultDynamicSecret" and
      .metadata.name == "hub-a-traefik-origin" and
      .metadata.namespace == "traefik" and
      .metadata.annotations."argocd.argoproj.io/sync-wave" == "1" and
      .spec.path == "pki_int/issue/hub-a-traefik-origin" and
      .spec.provider.auth.kubernetes.role == "hub-a-traefik-origin-issuer" and
      .spec.provider.auth.kubernetes.serviceAccountRef.name == "traefik-origin-issuer"
    )
  ' - >/dev/null ||
  fail "trusted Traefik VaultDynamicSecret ownership or issuer configuration is incomplete"

for values_file in helm/dotdev-studio/values.yaml helm/dotdev-studio/values-prod.yaml; do
  yq -e '.env.TRUSTED_ORIGINS == "https://studio.dsqr.dev"' "$values_file" >/dev/null ||
    fail "$values_file trusts a sibling origin"
done
for values_file in helm/dotdev-web/values-prod.yaml helm/dotdev-studio/values-prod.yaml; do
  yq -e '.env.AUTH_TRUSTED_PROXIES == "10.0.0.0/16"' "$values_file" >/dev/null ||
    fail "$values_file does not declare the isolated Traefik pod proxy range"
done
for values_file in helm/dotdev-labs/values.yaml helm/dotdev-labs/values-prod.yaml; do
  yq -e '.env.TRUSTED_ORIGINS == "https://labs.dsqr.dev"' "$values_file" >/dev/null ||
    fail "$values_file trusts a sibling origin"
done

traefik_values="gitops/values/traefik/hub-a.yaml"
yq -e '
  .service.spec.externalTrafficPolicy == "Local" and
  (.ports.web.forwardedHeaders.trustedIPs | length) == 1 and
  .ports.web.forwardedHeaders.trustedIPs[0] == "10.10.60.100/32" and
  (.ports.websecure.forwardedHeaders.trustedIPs | length) == 1 and
  .ports.websecure.forwardedHeaders.trustedIPs[0] == "10.10.60.100/32"
' "$traefik_values" >/dev/null ||
  fail "Traefik does not preserve source IPs and sanitize forwarded headers at hub-a"

argocd_values="gitops/values/argocd/common.yaml"
yq -e '
  .global.networkPolicy.create == false and
  .global.networkPolicy.defaultDenyIngress == false and
  .controller.networkPolicy.create == false and
  .repoServer.networkPolicy.create == false and
  .server.networkPolicy.create == false and
  .redis.networkPolicy.create == false and
  .applicationSet.replicas == 0 and
  .applicationSet.metrics.enabled == false and
  .applicationSet.networkPolicy.create == false and
  ([.extraObjects[] | select(.kind == "NetworkPolicy")] | length) == 5 and
  ([.extraObjects[] |
    select(.kind == "NetworkPolicy" and .metadata.name == "argocd-default-deny-ingress")
  ] | length) == 1
' "$argocd_values" >/dev/null ||
  fail "Argo CD ingress policy is broader than the declared trusted flows"
if yq -e '
  .extraObjects[] |
  select(.kind == "NetworkPolicy" and .spec.ingress != null) |
  .spec.ingress[] |
  select(.from == null or (.from | length) == 0)
' "$argocd_values" >/dev/null; then
  fail "Argo CD contains an allow-all ingress rule"
fi
if yq -e '
  .extraObjects[] |
  select(.kind == "NetworkPolicy") |
  .spec.ingress[] |
  .from[] |
  select(
    .namespaceSelector != null and
    .namespaceSelector.matchLabels."kubernetes.io/metadata.name" == null
  )
' "$argocd_values" >/dev/null; then
  fail "Argo CD contains an unrestricted namespace selector"
fi

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
