{
  actionlint,
  lib,
  shellcheck,
  stdenvNoCC,
}:
stdenvNoCC.mkDerivation {
  name = "dsqr-dotdev-workflow-check";
  src = lib.fileset.toSource {
    root = ../..;
    fileset = lib.fileset.unions [
      ../../.github/workflows
      ../../nix/lib/smoke-oci-image.sh
    ];
  };

  nativeBuildInputs = [
    actionlint
    shellcheck
  ];

  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall

    actionlint -no-color .github/workflows/*.yml
    shellcheck nix/lib/smoke-oci-image.sh

    mkdir -p "$out"
    touch "$out/workflow-check"

    runHook postInstall
  '';
}
