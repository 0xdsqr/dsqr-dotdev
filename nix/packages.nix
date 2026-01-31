# Package derivations for dsqr-dotdev
#
# Builds two TanStack Start apps (dotdev + studio) for production.
# Nitro (via vite build) produces a self-contained .output/ directory
# with the server entry at .output/server/index.mjs.
#
# Build order (sequential dependencies):
#   1. bun install (offline via bunConfigHook)
#   2. @dsqr-dotdev/db   (Bun.build + tsc -> dist/)
#   3. @dsqr-dotdev/core  (Bun.build + tsc -> dist/, depends on db)
#   4. vite build for dotdev and/or studio (nitro produces .output/)
#
# @dsqr-dotdev/ui is consumed as raw TypeScript source by Vite (no build step).
#
{
  pkgs,
  self,
  bun2nix,
}:
let
  deps = import "${self}/bun.lock.nix";

  bunDeps = bun2nix.fetchBunDeps {
    inherit deps;
    bunLock = "${self}/bun.lock";
    name = "dsqr-dotdev-deps";
  };

  # Shared derivation for building an app.
  # Installs all deps offline, builds internal packages, then runs vite build
  # for the specified app.
  mkApp =
    {
      pname,
      appDir, # e.g. "apps/dotdev"
      port, # for documentation / passthru
    }:
    pkgs.stdenv.mkDerivation {
      inherit pname;
      version = "0.0.0";
      src = self;
      strictDeps = true;

      nativeBuildInputs = [
        pkgs.bun
        pkgs.nodejs
        bun2nix.bunConfigHook
      ];

      bunOfflineCache = bunDeps;

      buildPhase = ''
        runHook preBuild

        # Build internal packages (sequential: db -> core)
        echo "Building @dsqr-dotdev/db..."
        bun run --filter='@dsqr-dotdev/db' build

        echo "Building @dsqr-dotdev/core..."
        bun run --filter='@dsqr-dotdev/core' build

        # Build the app with Vite
        echo "Building ${pname}..."
        bun run --filter='${pname}' build


        runHook postBuild
      '';

      installPhase = ''
                runHook preInstall

                mkdir -p $out

                # Nitro bundles everything into .output/ (server + client assets + deps).
                cp -r ${appDir}/.output $out/.output

                # Create a wrapper script
                mkdir -p $out/bin
                cat > $out/bin/${pname} <<WRAPPER
        #!/bin/sh
        exec ${pkgs.nodejs}/bin/node $out/.output/server/index.mjs "\$@"
        WRAPPER
                chmod +x $out/bin/${pname}

                runHook postInstall
      '';

      passthru = {
        inherit port;
        deps = bunDeps;
        node = pkgs.nodejs;
      };
    };

in
{
  dotdev = mkApp {
    pname = "dotdev";
    appDir = "apps/dotdev";
    port = 3000;
  };

  studio = mkApp {
    pname = "studio";
    appDir = "apps/studio";
    port = 3001;
  };

  # Generator script (kept here so flake.nix stays clean)
  generate-deps = pkgs.writeShellScriptBin "generate-deps" ''
    exec ${pkgs.bun}/bin/bun run ${self}/nix/bun2nix/src/generate-deps-nix.ts "$@"
  '';
}
