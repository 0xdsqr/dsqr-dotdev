{ pkgs, gitopsGenerateApplications }:
pkgs.writeShellApplication {
  name = "gitops-release-image";

  runtimeInputs = [
    pkgs.coreutils
    pkgs.git
    pkgs.yq-go
    gitopsGenerateApplications
  ];

  text = ''
    set -euo pipefail

    usage() {
      cat <<'EOF'
    Usage:
      gitops-release-image --app <app> --version <semver> --digest <sha256:digest> --source-revision <commit>

    Apps:
      dotdev-web
      dotdev-studio
      dotdev-labs

    The app package version is the release source of truth. This command refuses
    to stamp a different version, then pins production to the supplied digest.
    EOF
    }

    app=""
    version=""
    digest=""
    source_revision=""

    while [[ $# -gt 0 ]]; do
      case "$1" in
        --app)
          app="''${2:-}"
          shift 2
          ;;
        --version)
          version="''${2:-}"
          shift 2
          ;;
        --digest)
          digest="''${2:-}"
          shift 2
          ;;
        --source-revision)
          source_revision="''${2:-}"
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

    if [[ -z "$app" || -z "$version" || -z "$digest" || -z "$source_revision" ]]; then
      usage >&2
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

    if [[ ! "$source_revision" =~ ^[0-9a-f]{40}$ ]]; then
      echo "Source revision must be a full lowercase 40-character Git commit." >&2
      exit 2
    fi

    case "$app" in
      dotdev-web)
        package_file="apps/dotdev/package.json"
        chart_file="helm/dotdev-web/Chart.yaml"
        values_file="helm/dotdev-web/values-prod.yaml"
        template_file="gitops/templates/applications/dotdev-web.yaml.tmpl"
        ;;
      dotdev-studio)
        package_file="apps/studio/package.json"
        chart_file="helm/dotdev-studio/Chart.yaml"
        values_file="helm/dotdev-studio/values-prod.yaml"
        template_file="gitops/templates/applications/dotdev-studio.yaml.tmpl"
        ;;
      dotdev-labs)
        package_file="apps/labs/package.json"
        chart_file="helm/dotdev-labs/Chart.yaml"
        values_file="helm/dotdev-labs/values-prod.yaml"
        template_file="gitops/templates/applications/dotdev-labs.yaml.tmpl"
        ;;
      *)
        echo "Unknown app '$app'." >&2
        usage >&2
        exit 2
        ;;
    esac

    package_version="$(yq -r '.version' "$package_file")"
    if [[ "$package_version" != "$version" ]]; then
      echo "$app package version is $package_version, not requested release $version." >&2
      exit 1
    fi

    yq -i ".version = \"$version\" | .appVersion = \"$version\"" "$chart_file"
    yq -i '.image.tag = ""' "$values_file"
    yq -i ".image.digest = \"$digest\"" "$values_file"
    yq -i '.image.requireDigest = true' "$values_file"
    yq -i '.image.pullPolicy = "IfNotPresent"' "$values_file"

    VERSION="$version" DIGEST="$digest" SOURCE_REVISION="$source_revision" \
      yq -i '
        .metadata.annotations."homelab.dev/image-digest" = strenv(DIGEST) |
        .metadata.annotations."homelab.dev/source-revision" = strenv(SOURCE_REVISION) |
        del(.metadata.annotations."homelab.dev/image-tag") |
        .metadata.labels."app.kubernetes.io/version" = strenv(VERSION)
      ' "$template_file"

    gitops-generate-applications
    echo "$app $version -> $digest ($source_revision)"
  '';
}
