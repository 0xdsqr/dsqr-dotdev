{
  perSystem =
    {
      config,
      pkgs,
      lib,
      ...
    }:
    let
      appNames = [
        "dotdev"
        "labs"
        "studio"
      ];

      # Installs (or refreshes) node_modules from the lockfile only when it changed, so
      # `nix run .#dev` works from a fresh clone with no other setup.
      ensureNodeModules = ''
        if [[ ! -f package-lock.json || ! -d apps ]]; then
          echo "Run this from the repository root." >&2
          exit 1
        fi
        want="$(sha256sum package-lock.json | cut -d' ' -f1)"
        if [[ "$(cat node_modules/.lock-hash 2>/dev/null)" != "$want" ]]; then
          echo "Installing npm dependencies from package-lock.json..."
          npm ci --no-audit --no-fund
          echo "$want" > node_modules/.lock-hash
        fi
      '';
    in
    {
      packages =
        lib.genAttrs appNames (appName: pkgs.callPackage ./app.nix { inherit appName; })
        // {
          default = config.packages.dotdev;
        }
        // lib.optionalAttrs pkgs.stdenv.hostPlatform.isLinux (
          lib.listToAttrs (
            map (appName: {
              name = "${appName}-image";
              value = pkgs.callPackage ./image.nix {
                inherit appName;
                app = config.packages.${appName};
              };
            }) appNames
          )
        );

      apps =
        lib.genAttrs appNames (appName: {
          type = "app";
          meta.description = "Run the production ${appName} server";
          program = "${config.packages.${appName}}/bin/${appName}";
        })
        // lib.listToAttrs (
          map (appName: {
            name = "dev-${appName}";
            value = {
              type = "app";
              meta.description = "Run the ${appName} development server (installs npm dependencies if needed)";
              program = lib.getExe (
                pkgs.writeShellApplication {
                  name = "${appName}-dev";
                  runtimeInputs = [
                    pkgs.nodejs_26
                    pkgs.coreutils
                  ];
                  text = ''
                    ${ensureNodeModules}
                    exec npm run dev --workspace ${appName} -- "$@"
                  '';
                }
              );
            };
          }) appNames
        )
        // {
          default = config.apps.dotdev;
          dev = config.apps.dev-dotdev;

          update-npm-hash = {
            type = "app";
            meta.description = "Recompute the npm dependency hash in nix/packages/app.nix from package-lock.json";
            program = lib.getExe (
              pkgs.writeShellApplication {
                name = "update-npm-hash";
                runtimeInputs = [
                  pkgs.prefetch-npm-deps
                  pkgs.gnused
                ];
                text = ''
                  if [[ ! -f nix/packages/app.nix ]]; then
                    echo "Run this from the repository root." >&2
                    exit 1
                  fi
                  hash="$(prefetch-npm-deps package-lock.json)"
                  sed -i -E "s|hash = \"sha256-[^\"]+\";|hash = \"$hash\";|" nix/packages/app.nix
                  echo "npm dependency hash: $hash"
                '';
              }
            );
          };
        };
    };
}
