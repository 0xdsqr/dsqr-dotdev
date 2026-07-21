{
  lib,
  stdenvNoCC,
  nodejs_24,
  gitopsReleaseImage,
}:
stdenvNoCC.mkDerivation {
  name = "dsqr-dotdev-release-versioning-check";
  src = lib.fileset.toSource {
    root = ../..;
    fileset = lib.fileset.unions [
      ../../.changeset
      ../../package.json
      ../scripts/check-release-versions.mjs
      (lib.fileset.fileFilter (
        file: file.name == "package.json" || file.name == "CHANGELOG.md"
      ) ../../apps)
      (lib.fileset.fileFilter (
        file: file.name == "package.json" || file.name == "CHANGELOG.md"
      ) ../../packages)
      (lib.fileset.fileFilter (
        file:
        builtins.elem file.name [
          "Chart.yaml"
          "values-prod.yaml"
        ]
      ) ../../helm)
      ../../gitops/values/dotdev-web/hub-a.yaml
      ../../gitops/values/dotdev-studio/hub-a.yaml
      ../../gitops/values/dotdev-labs/hub-a.yaml
      ../../gitops/clusters/hub-a/config.yaml
    ];
  };

  nativeBuildInputs = [
    gitopsReleaseImage
    nodejs_24
  ];
  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall
    node nix/scripts/check-release-versions.mjs

    testRoot="$TMPDIR/release-promotion-test"
    mkdir -p \
      "$testRoot/apps/dotdev" \
      "$testRoot/helm/dotdev-web" \
      "$testRoot/gitops/clusters/hub-a" \
      "$testRoot/gitops/values/dotdev-web"
    cp apps/dotdev/package.json "$testRoot/apps/dotdev/package.json"
    cp helm/dotdev-web/Chart.yaml "$testRoot/helm/dotdev-web/Chart.yaml"
    cp gitops/clusters/hub-a/config.yaml "$testRoot/gitops/clusters/hub-a/config.yaml"
    cp gitops/values/dotdev-web/hub-a.yaml "$testRoot/gitops/values/dotdev-web/hub-a.yaml"

    packageVersion="$(node -p 'require(process.argv[1]).version' "$testRoot/apps/dotdev/package.json")"
    (
      cd "$testRoot"
      gitops-release-image \
        --cluster hub-a \
        --app dotdev-web \
        --version "$packageVersion" \
        --digest sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      grep -Fx '  digest: sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' \
        gitops/values/dotdev-web/hub-a.yaml >/dev/null

      cp helm/dotdev-web/Chart.yaml "$TMPDIR/chart-before-failure.yaml"
      cp gitops/values/dotdev-web/hub-a.yaml "$TMPDIR/values-before-failure.yaml"
      if gitops-release-image \
        --cluster hub-a \
        --app dotdev-web \
        --version "$packageVersion" \
        --digest latest >/dev/null 2>&1; then
        echo "release promotion accepted a mutable digest" >&2
        exit 1
      fi
      cmp "$TMPDIR/chart-before-failure.yaml" helm/dotdev-web/Chart.yaml
      cmp "$TMPDIR/values-before-failure.yaml" gitops/values/dotdev-web/hub-a.yaml
    )

    mkdir -p "$out"
    touch "$out/release-versioning-check"
    runHook postInstall
  '';
}
