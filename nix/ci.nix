{
  perSystem =
    { pkgs, lib, ... }:
    let
      script = name: description: runtimeInputs: text: {
        type = "app";
        meta.description = description;
        program = lib.getExe (pkgs.writeShellApplication { inherit name runtimeInputs text; });
      };
    in
    {
      apps = {
        ci-image-scan =
          script "ci-image-scan" "Scan an image archive with Trivy and write a CycloneDX SBOM" [ pkgs.trivy ]
            ''
              if [[ $# -ne 2 ]]; then
                echo "usage: ci-image-scan <image-archive> <sbom-output>" >&2
                exit 2
              fi
              archive="$1"
              sbom="$2"
              trivy image --input "$archive" --scanners vuln --severity HIGH,CRITICAL \
                --ignore-unfixed --exit-code 1 --no-progress
              trivy image --input "$archive" --format cyclonedx --output "$sbom" --quiet
            '';

        ci-image-push =
          script "ci-image-push" "Push an image archive to a registry and print its digest" [ pkgs.skopeo ]
            ''
              if [[ $# -ne 2 ]]; then
                echo "usage: ci-image-push <image-archive> <registry-ref>" >&2
                exit 2
              fi
              workdir="$(mktemp -d)"
              trap 'rm -rf "$workdir"' EXIT
              echo '{"default":[{"type":"insecureAcceptAnything"}]}' >"$workdir/policy.json"
              skopeo copy --quiet --policy "$workdir/policy.json" --format oci \
                --digestfile "$workdir/digest" "docker-archive:$1" "docker://$2"
              cat "$workdir/digest"
            '';

        ci-image-index =
          script "ci-image-index"
            "Combine per-architecture images into one index, tag it, and print its digest"
            [ pkgs.crane ]
            ''
              if [[ $# -lt 3 ]]; then
                echo "usage: ci-image-index <repository> <tag[,tag...]> <digest>..." >&2
                exit 2
              fi
              repository="$1"
              IFS=, read -ra tags <<<"$2"
              shift 2
              manifests=()
              for digest in "$@"; do
                manifests+=(--manifest "$repository@$digest")
              done
              crane index append "''${manifests[@]}" --tag "$repository:''${tags[0]}" >/dev/null
              digest="$(crane digest "$repository:''${tags[0]}")"
              for tag in "''${tags[@]:1}"; do
                crane tag "$repository@$digest" "$tag"
              done
              echo "$digest"
            '';
      };
    };
}
