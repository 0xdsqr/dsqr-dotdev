{ pkgs, lib }:
let
  python = pkgs.python3.withPackages (p: [
    p.pyyaml
    p.jsonschema
  ]);
  # Fixed-output schema fetches are separate from the network-isolated check.
  kubernetesSchema = pkgs.fetchurl {
    url = "https://raw.githubusercontent.com/kubernetes/kubernetes/v1.36.0/api/openapi-spec/swagger.json";
    hash = "sha256-3O3iBj2h161i7LWvitttf6vQtSOFp/oASK+0kdrJBFA=";
  };
  gatewaySchema = pkgs.fetchurl {
    url = "https://raw.githubusercontent.com/kubernetes-sigs/gateway-api/v1.5.0/config/crd/standard/gateway.networking.k8s.io_httproutes.yaml";
    hash = "sha256-tTVxyw6+x29h5C72NPEN1TmImC7Lwj8Tf2GuVgl4+2A=";
  };
in
pkgs.runCommand "dsqr-app-helm-check"
  {
    nativeBuildInputs = [
      pkgs.kubernetes-helm
      python
    ];
    src = lib.fileset.toSource {
      root = ../..;
      fileset = ../../helm;
    };
  }
  ''
    export HOME="$TMPDIR"
    export HELM_CACHE_HOME="$TMPDIR/helm-cache"
    export HELM_CONFIG_HOME="$TMPDIR/helm-config"
    export HELM_DATA_HOME="$TMPDIR/helm-data"
    python ${./helm.py} "$src/helm/dsqr-app" ${kubernetesSchema} ${gatewaySchema}
    helm package "$src/helm/dsqr-app" --destination "$TMPDIR"
    touch "$out"
  ''
