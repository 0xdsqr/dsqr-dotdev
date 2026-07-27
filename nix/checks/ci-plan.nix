{
  git,
  nodejs_24,
  runCommand,
}:
runCommand "dsqr-dotdev-ci-plan-check"
  {
    nativeBuildInputs = [
      git
      nodejs_24
    ];
  }
  ''
    export CI_PLAN_SCRIPT=${../scripts/plan-ci.mjs}
    export CI_APP_REGISTRY=${../ci/apps.json}
    node --test ${./ci-plan.test.mjs}
    touch "$out"
  ''
