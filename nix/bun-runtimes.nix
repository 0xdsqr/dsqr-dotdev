# Pre-fetched bun runtimes for offline cross-compilation.
#
# When `bun build --compile --target=bun-<platform>` runs, bun downloads
# the target platform's runtime from GitHub. This is blocked in the Nix
# sandbox, so we provide them as fixed-output derivations.
#
# Bun stores runtimes in BUN_INSTALL_CACHE_DIR as:
#   bun-<arch>-v<version>  (e.g., bun-linux-aarch64-v1.3.6)
#
# To update version/hashes:
#   nix-prefetch-url --unpack https://github.com/oven-sh/bun/releases/download/bun-v<VERSION>/bun-<ARCH>.zip
#   nix hash convert --hash-algo sha256 --to sri <base32-hash>
#
{ fetchzip, runCommand }:
let
  version = "1.3.6";
  baseUrl = "https://github.com/oven-sh/bun/releases/download/bun-v${version}";

  archMap = {
    "linux-x64" = "linux-x64";
    "linux-arm64" = "linux-aarch64";
    "darwin-x64" = "darwin-x64";
    "darwin-arm64" = "darwin-aarch64";
  };

  mkRuntime =
    target: zipHash:
    let
      bunArch = archMap.${target};
      cacheName = "bun-${bunArch}-v${version}";
      zipSrc = fetchzip {
        url = "${baseUrl}/bun-${bunArch}.zip";
        hash = zipHash;
      };
    in
    runCommand "bun-runtime-${target}" { } ''
      mkdir -p $out
      cp ${zipSrc}/bun $out/${cacheName}
      chmod +x $out/${cacheName}
      echo "${cacheName}" > $out/cache-name
    '';
in
{
  inherit version;

  "linux-x64" = mkRuntime "linux-x64" "sha256-Mtig0xmG9NN9wsD5+8gPMUZ2H2BjOsuaW9IDUB6S5yg=";
  "linux-arm64" = mkRuntime "linux-arm64" "sha256-g1iPhnRzM4rGUqPOX2db5NuVrIQce3PZtY25Idxr1uo=";
  "darwin-x64" = mkRuntime "darwin-x64" "sha256-T31QI8fwHMF6jWfcWxgaFwtlwWECupEqof1Eg1WHG88=";
  "darwin-arm64" = mkRuntime "darwin-arm64" "sha256-6prBOyiHD6o2BifC1v0W5Vf9bTiQi1JyiPPAcmw+ixc=";
}
