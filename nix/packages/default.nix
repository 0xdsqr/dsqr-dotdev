{ pkgs }:
let
  hashes = import ../hashes.nix;
  system = pkgs.stdenvNoCC.hostPlatform.system;
  nodeModulesHash =
    if builtins.hasAttr system hashes.nodeModules then
      hashes.nodeModules.${system}
    else
      pkgs.lib.fakeHash;

  nodeModules = pkgs.callPackage ./node-modules.nix {
    npmDepsHash = nodeModulesHash;
  };

  dotdev = pkgs.callPackage ./dotdev.nix {
    inherit nodeModules;
  };

  studio = pkgs.callPackage ./studio.nix {
    inherit nodeModules;
  };
in
{
  inherit dotdev nodeModules studio;

  nodeModulesUpdater = nodeModules.override {
    npmDepsHash = pkgs.lib.fakeHash;
  };
}
// (import ./images.nix {
  inherit dotdev pkgs studio;
})
