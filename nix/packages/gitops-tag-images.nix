{ pkgs }:
pkgs.writeShellApplication {
  name = "gitops-tag-images";

  runtimeInputs = [
    pkgs.git
    pkgs.yq-go
  ];

  text = ''
    set -euo pipefail

    usage() {
      cat <<'EOF'
    Usage:
      gitops-tag-images [--tag sha-<commit>] [--all|app...]

    Apps:
      dotdev-web
      dotdev-studio
      dotdev-labs

    Defaults:
      --tag defaults to sha-$(git rev-parse HEAD)
      apps and --all default to the dsqr.dev images built by this repo: dotdev-web dotdev-studio dotdev-labs
    EOF
    }

    tag=""
    all=false
    apps=()

    while [[ $# -gt 0 ]]; do
      case "$1" in
        --tag)
          if [[ $# -lt 2 ]]; then
            echo "--tag requires a value" >&2
            exit 2
          fi
          tag="$2"
          shift 2
          ;;
        --all)
          all=true
          shift
          ;;
        -h|--help)
          usage
          exit 0
          ;;
        *)
          apps+=("$1")
          shift
          ;;
      esac
    done

    if [[ -z "$tag" ]]; then
      tag="sha-$(git rev-parse HEAD)"
    fi

    if [[ "$tag" != sha-* ]]; then
      echo "Refusing mutable image tag '$tag'. Use the sha-<commit> tag published by CI." >&2
      exit 2
    fi

    if [[ "$all" == true && ''${#apps[@]} -gt 0 ]]; then
      echo "Use either --all or explicit app names, not both." >&2
      exit 2
    fi

    if [[ "$all" == true ]]; then
      apps=(dotdev-web dotdev-studio dotdev-labs)
    elif [[ ''${#apps[@]} -eq 0 ]]; then
      apps=(dotdev-web dotdev-studio dotdev-labs)
    fi

    update_app() {
      local app="$1"
      local chart_file
      local values_file
      local appset_file="gitops/clusters/homelab/applications/dsqr-apps.applicationset.yaml"

      case "$app" in
        dotdev-web)
          chart_file="helm/dotdev-web/Chart.yaml"
          values_file="helm/dotdev-web/values-prod.yaml"
          ;;
        dotdev-studio)
          chart_file="helm/dotdev-studio/Chart.yaml"
          values_file="helm/dotdev-studio/values-prod.yaml"
          ;;
        dotdev-labs)
          chart_file="helm/dotdev-labs/Chart.yaml"
          values_file="helm/dotdev-labs/values-prod.yaml"
          ;;
        *)
          echo "Unknown app '$app'." >&2
          usage >&2
          exit 2
          ;;
      esac

      yq -i ".appVersion = \"$tag\"" "$chart_file"
      yq -i ".image.tag = \"$tag\"" "$values_file"
      APP="$app" TAG="$tag" yq -i '(.spec.generators[].list.elements[] | select(.name == strenv(APP)).imageTag) = strenv(TAG)' "$appset_file"
      echo "$app -> $tag"
    }

    for app in "''${apps[@]}"; do
      update_app "$app"
    done
  '';
}
