# bun2nix - Offline Bun packaging for Nix
#
# Provides:
#   bunConfigHook        - Setup hook for offline bun install in Nix sandbox
#   bunRuntimeHook       - Setup hook to inject cross-compilation runtimes
#   fetchBunDeps         - Build a Bun-compatible offline cache from FODs
#
{
  pkgs ? import <nixpkgs> { },
  lib ? pkgs.lib,
  stdenv ? pkgs.stdenv,
  bun ? pkgs.bun,
  diffutils ? pkgs.diffutils,
  libarchive ? pkgs.libarchive,
  makeSetupHook ? pkgs.makeSetupHook,
  fetchurl ? pkgs.fetchurl,
  runCommand ? pkgs.runCommand,
}:

let
  # Platform-aware bun install flags:
  # - --backend=copyfile on Darwin (symlink hangs on Linux in Nix sandbox)
  # - --backend=hardlink on Linux (fast, flat layout)
  # - --ignore-scripts prevents postinstall scripts from running (no network)
  # - Do NOT use --frozen-lockfile as it can trigger network verification
  #
  # IMPORTANT: We do NOT use --linker=isolated because Vite runs via Node,
  # which uses Node's module resolution algorithm. The isolated linker puts
  # deps in node_modules/.bun/ which Node can't resolve. We need a flat
  # node_modules layout.
  bunInstallFlags =
    if stdenv.hostPlatform.isDarwin then
      "--ignore-scripts --backend=copyfile"
    else
      "--ignore-scripts --backend=hardlink";

  # ---------------------------------------------------------------------------
  # Setup hook: offline bun install
  # ---------------------------------------------------------------------------
  bunConfigHook = makeSetupHook {
    name = "bun-config-hook";
    propagatedBuildInputs = [ bun ];
    substitutions = {
      diff = "${diffutils}/bin/diff";
      inherit bunInstallFlags;
    };
    meta.description = "Configure bun to use offline cache and install dependencies";
  } ./bun-config-hook.sh;

  # ---------------------------------------------------------------------------
  # Setup hook: inject cross-compilation runtime
  # ---------------------------------------------------------------------------
  bunRuntimeHook = makeSetupHook {
    name = "bun-runtime-hook";
    meta.description = "Inject pre-fetched bun runtime into cache for cross-compilation";
  } ./bun-runtime-hook.sh;

  # ---------------------------------------------------------------------------
  # Offline dependency cache builder
  #
  # Fetches all npm tarballs as FODs (fixed-output derivations, content-addressed
  # and cached forever by Nix), then extracts them into Bun's expected cache
  # directory structure.
  # ---------------------------------------------------------------------------
  fetchBunDeps =
    {
      deps,
      bunLock,
      name ? "bun-deps",
    }:
    let
      fetchPackage =
        _key: pkg:
        fetchurl {
          url = pkg.url;
          hash = pkg.integrity;
          name = "${lib.strings.sanitizeDerivationName pkg.name}-${pkg.version}.tgz";
        };

      packageDerivations = lib.mapAttrs fetchPackage deps.packages;

      extractScript = lib.concatStringsSep "\n" (
        lib.mapAttrsToList (
          key: pkg:
          let
            tarball = packageDerivations.${key};
            cacheDir = "$out/${pkg.cachePath}";
          in
          ''
            mkdir -p "${cacheDir}"
            ${libarchive}/bin/bsdtar --extract --file ${tarball} --directory "${cacheDir}" --strip-components=1 --no-same-owner --no-same-permissions
          ''
        ) deps.packages
      );
    in
    runCommand name
      {
        nativeBuildInputs = [ libarchive ];
      }
      ''
        mkdir -p $out

        echo "Assembling ${toString deps.packageCount} packages..."

        ${extractScript}

        cp ${bunLock} $out/bun.lock

        echo "Done! Cache assembled at $out"
      '';

in
{
  inherit
    bunConfigHook
    bunRuntimeHook
    fetchBunDeps
    ;
}
