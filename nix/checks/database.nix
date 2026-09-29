{
  lib,
  buildNpmPackage,
  nodejs_24,
  postgresql_18,
  npmDeps,
  dbStart,
  dbStop,
}:
(buildNpmPackage.override { nodejs = nodejs_24; }) {
  pname = "database-check";
  version = "0.0.0";
  src = lib.fileset.toSource {
    root = ../..;
    fileset = lib.fileset.unions [
      ../../package.json
      ../../package-lock.json
      ../../tsconfig.base.json
      ../../apps/dotdev/package.json
      ../../apps/labs/package.json
      ../../apps/studio/package.json
      ../../packages/api/package.json
      ../../packages/react/package.json
      ../../packages/database/package.json
      ../../packages/database/tsconfig.json
      ../../packages/database/drizzle.config.ts
      ../../packages/database/src
      ../../packages/database/tests
    ];
  };
  inherit npmDeps;
  npmRebuildFlags = [ "--ignore-scripts" ];
  npmBuildScript = "typecheck";
  npmBuildFlags = [ "--workspace=@dsqr-dotdev/database" ];
  nativeBuildInputs = [
    postgresql_18
    dbStart
    dbStop
  ];
  __darwinAllowLocalNetworking = true;
  postBuild = ''
    # Private Unix sockets only; no external DB, secrets, or email provider.
    db-start
    trap db-stop EXIT
    db-start
    export PGHOST="$PWD/.local/postgres/socket" PGPORT=55432 PGUSER=dsqr_dev PGDATABASE=dsqr_dotdev_dev
    psql -v ON_ERROR_STOP=1 -c "CREATE TABLE public.legacy_sentinel (id integer PRIMARY KEY); INSERT INTO public.legacy_sentinel VALUES (1);"
    npm run db:push -- --force
    npm run db:push -- --force
    node --test packages/database/tests/database.test.ts
    # Recreate only this check's disposable app schema to exercise migrations
    # independently of push. The public sentinel must survive both workflows.
    psql -v ON_ERROR_STOP=1 -c "DROP SCHEMA app CASCADE;"
    npm run db:generate -- --name=check
    npm run db:migrate
    npm run db:migrate
    node --test packages/database/tests/database.test.ts
    db-stop
    db-start
    test "$(psql -Atqc 'SELECT count(*) FROM app.subscriptions')" = 1
    db-stop
    db-stop
    trap - EXIT
  '';
  installPhase = ''touch "$out"'';
}
