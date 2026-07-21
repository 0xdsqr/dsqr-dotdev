{
  jq,
  lib,
  runCommand,
}:
let
  root = ../..;
  manifests = lib.cleanSourceWith {
    src = root;
    filter =
      path: type:
      let
        name = baseNameOf (toString path);
      in
      type == "directory"
      || builtins.elem name [
        "package-lock.json"
        "package.json"
      ];
  };
in
runCommand "dsqr-dotdev-normalized-manifests"
  {
    nativeBuildInputs = [ jq ];
  }
  ''
    cp -R ${manifests} "$out"
    chmod -R u+w "$out"

    while IFS= read -r manifest; do
      jq '
        def internal:
          (.key | startswith("@dsqr-dotdev/")) or
          (.key == "dotdev") or
          (.key == "labs") or
          (.key == "studio");
        def normalize_dependencies:
          if . == null then null else with_entries(if internal then .value = "0.0.0" else . end) end;
        def normalize_dependency_fields:
          if has("dependencies") then .dependencies |= normalize_dependencies else . end |
          if has("devDependencies") then .devDependencies |= normalize_dependencies else . end |
          if has("peerDependencies") then .peerDependencies |= normalize_dependencies else . end |
          if has("optionalDependencies") then .optionalDependencies |= normalize_dependencies else . end;
        .version = "0.0.0" |
        normalize_dependency_fields
      ' "$manifest" > "$manifest.tmp"
      mv "$manifest.tmp" "$manifest"
    done < <(find "$out" -name package.json -type f)

    jq '
      def internal:
        (.key | startswith("@dsqr-dotdev/")) or
        (.key == "dotdev") or
        (.key == "labs") or
        (.key == "studio");
      def normalize_dependencies:
        if . == null then null else with_entries(if internal then .value = "0.0.0" else . end) end;
      def normalize_dependency_fields:
        if has("dependencies") then .dependencies |= normalize_dependencies else . end |
        if has("devDependencies") then .devDependencies |= normalize_dependencies else . end |
        if has("peerDependencies") then .peerDependencies |= normalize_dependencies else . end |
        if has("optionalDependencies") then .optionalDependencies |= normalize_dependencies else . end;
      def workspace_root:
        .key | test("^(apps/[^/]+|packages/(api|database|haven|infra-model|observability|react|typescript-config)|packages/effect-pulumi/[^/]+)$");
      .version = "0.0.0" |
      .packages[""].version = "0.0.0" |
      .packages |= with_entries(
        if workspace_root then
          .value.version = "0.0.0" |
          .value |= normalize_dependency_fields
        else
          .
        end
      )
    ' "$out/package-lock.json" > "$out/package-lock.json.tmp"
    mv "$out/package-lock.json.tmp" "$out/package-lock.json"
  ''
