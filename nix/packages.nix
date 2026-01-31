# Package derivations for dsqr-dotdev
#
# Builds two TanStack Start apps (dotdev + studio) for production.
# Each app is a Node.js SSR server at dist/server/server.js.
#
# Build order (sequential dependencies):
#   1. bun install (offline via bunConfigHook)
#   2. @dsqr-dotdev/db   (Bun.build + tsc -> dist/)
#   3. @dsqr-dotdev/core  (Bun.build + tsc -> dist/, depends on db)
#   4. vite build for dotdev and/or studio
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

        # Copy the built app
        cp -r ${appDir}/dist $out/dist

        # Copy node_modules (runtime deps), removing workspace symlinks
        # that would be broken in the output (they point back into the
        # build source tree which doesn't exist in $out)
        cp -r node_modules $out/node_modules
        find $out/node_modules -maxdepth 2 -type l ! -exec test -e {} \; -delete

        # Copy built internal packages and re-create workspace symlinks
        # so Node's require() can find them at runtime
        mkdir -p $out/packages/db $out/packages/core $out/packages/ui
        cp -r packages/db/dist $out/packages/db/dist
        cp packages/db/package.json $out/packages/db/package.json
        cp -r packages/core/dist $out/packages/core/dist
        cp packages/core/package.json $out/packages/core/package.json
        cp -r packages/ui/src $out/packages/ui/src
        cp packages/ui/package.json $out/packages/ui/package.json

        # Re-create workspace symlinks for packages needed at runtime
        ln -sfn ../../packages/db $out/node_modules/@dsqr-dotdev/db
        ln -sfn ../../packages/core $out/node_modules/@dsqr-dotdev/core
        ln -sfn ../../packages/ui $out/node_modules/@dsqr-dotdev/ui

        # Root package.json for module resolution
        cp package.json $out/package.json

        # Create a wrapper script
        mkdir -p $out/bin
        cat > $out/bin/${pname} <<WRAPPER
        #!/bin/sh
        exec ${pkgs.nodejs}/bin/node $out/dist/server/server.js "\$@"
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
