{
  git,
  lib,
  nodejs_24,
  writeShellApplication,
}:
writeShellApplication {
  name = "ci-plan";
  runtimeInputs = [
    git
    nodejs_24
  ];
  text = ''
    export CI_REPO_ROOT="$PWD"
    exec node ${../scripts/plan-ci.mjs} "$@"
  '';
  meta = {
    description = "Compute the dsqr-dotdev CI app matrix from the workspace graph";
    platforms = lib.platforms.all;
  };
}
