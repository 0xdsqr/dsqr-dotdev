{ self, ... }:
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
      production = pkgs.writeShellApplication {
        name = "db-migrate-production";
        runtimeInputs = [
          pkgs.nix
          pkgs.openssh
        ];
        text = ''
          if [[ $# -eq 1 && "$1" == --help ]]; then
            echo 'usage: nix run .#db-migrate-production -- --check|--apply'
            echo 'Target: srv-lx-knox / dsqr-dotdev; owner: dsqr-dotdev.'
            echo '--check builds/copies the runner and checks history without applying migrations.'
            echo '--apply requires typed confirmation before applying packaged Drizzle migrations.'
            echo 'Uses the Khaos Linux builder, SSH and passwordless sudo to OS postgres on Knox.'
            exit 0
          fi
          if [[ $# -ne 1 || ( "$1" != --check && "$1" != --apply ) ]]; then
            echo 'Specify --check or --apply explicitly; use --help for details.' >&2
            exit 2
          fi
          mode="$1"
          if [[ "$mode" == --apply ]]; then
            if [[ ! -t 0 ]]; then
              echo 'Production apply requires an interactive terminal.' >&2
              exit 2
            fi
            echo 'This applies the packaged migrations to dsqr-dotdev on srv-lx-knox.'
            echo 'Review the migrations and ensure a recoverable backup before proceeding.'
            read -r -p 'Type dsqr-dotdev@srv-lx-knox to continue: ' confirmation
            if [[ "$confirmation" != dsqr-dotdev@srv-lx-knox ]]; then
              echo 'Cancelled.' >&2
              exit 2
            fi
          fi
          payload="$(nix build --no-link --print-out-paths \
            --store ssh-ng://srv-lx-khaos --eval-store auto \
            --max-jobs 1 --builders "" \
            --no-update-lock-file \
            '${self.outPath}#packages.x86_64-linux.db-migrate-knox')"
          if [[ ! "$payload" =~ ^/nix/store/[a-z0-9]{32}-dotdev-db-migrate-0.0.0$ ]]; then
            echo 'Unexpected migration package output; stopping.' >&2
            exit 1
          fi
          nix copy --from ssh-ng://srv-lx-khaos \
            --to 'ssh-ng://srv-lx-knox?remote-program=sudo%20-n%20/run/current-system/sw/bin/nix-daemon' \
            --no-check-sigs "$payload"
          exec ssh -o BatchMode=yes -o ConnectTimeout=10 srv-lx-knox \
            "sudo -n -u postgres env -i PATH=/run/current-system/sw/bin $payload/bin/db-migrate-knox $mode"
        '';
      };
    in
    {
      packages.db-migrate-knox = pkgs.callPackage ./packages/db-migrate.nix {
        npmDeps = config.packages.dotdev.npmDeps;
      };
      apps.db-migrate-production = {
        type = "app";
        program = lib.getExe production;
        meta.description = "Explicitly check or apply Dotdev migrations on Knox over SSH";
      };
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
      checks.database-production-command = pkgs.runCommand "database-production-command-check" { } ''
        ${lib.getExe production} --help
        if ${lib.getExe production}; then exit 1; fi
        if ${lib.getExe production} --wrong; then exit 1; fi
        if ${lib.getExe production} --apply </dev/null; then exit 1; fi
        if ${lib.getExe config.packages.db-migrate-knox} --check; then exit 1; fi
        touch "$out"
      '';
    };
}
