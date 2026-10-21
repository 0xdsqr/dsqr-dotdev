{
  perSystem =
    {
      config,
      pkgs,
      lib,
      ...
    }:
    let
      command =
        action:
        pkgs.writeShellApplication {
          name = "db-${action}";
          runtimeInputs = [
            pkgs.postgresql_18
            pkgs.coreutils
          ];
          text = ''
            if [[ ! -f packages/database/drizzle.config.ts ]]; then
              echo "Run db-${action} from the repository root." >&2
              exit 1
            fi
            umask 077
            root="$PWD/.local/postgres"
            export PGDATA="$root/data" PGHOST="$root/socket"
            export PGPORT=55432 PGUSER=dsqr_dev PGDATABASE=dsqr_dotdev_dev
            unset PGHOSTADDR PGSERVICE PGSERVICEFILE PGOPTIONS
            ${
              if action == "start" then
                ''
                  mkdir -p "$root" "$PGHOST"
                  chmod 700 "$root" "$PGHOST"
                  if [[ ! -f "$PGDATA/PG_VERSION" ]]; then
                    initdb --auth-local=trust --auth-host=reject --username=dsqr_dev --no-locale --encoding=UTF8
                  fi
                  if [[ "$(cat "$PGDATA/PG_VERSION")" != 18 ]]; then
                    echo "Local cluster is not PostgreSQL 18; refusing to start it." >&2
                    exit 1
                  fi
                  if ! pg_ctl status >/dev/null 2>&1; then
                    pg_ctl -l "$root/server.log" -o "-h \"\" -k \"$PGHOST\" -p $PGPORT" -w start
                  fi
                  if [[ "$(psql -d postgres -Atqc "SELECT 1 FROM pg_database WHERE datname = 'dsqr_dotdev_dev'")" != 1 ]]; then
                    createdb dsqr_dotdev_dev
                  fi
                  echo "Local database ready. Apply the schema explicitly with: npm run db:push"
                ''
              else
                ''
                  if [[ -f "$PGDATA/PG_VERSION" ]] && pg_ctl status >/dev/null 2>&1; then
                    pg_ctl -m fast -w stop
                  else
                    echo "Local database is already stopped."
                  fi
                ''
            }
          '';
        };
      dbStart = command "start";
      dbStop = command "stop";
    in
    {
      apps.db-start = {
        type = "app";
        program = lib.getExe dbStart;
        meta.description = "Start the repository-local PostgreSQL 18 database";
      };
      apps.db-stop = {
        type = "app";
        program = lib.getExe dbStop;
        meta.description = "Stop the repository-local PostgreSQL database";
      };
      checks.database = pkgs.callPackage ./checks/database.nix {
        npmDeps = config.packages.dotdev.npmDeps;
        inherit dbStart dbStop;
      };
    };
}
