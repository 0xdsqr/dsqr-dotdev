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

  labs = pkgs.callPackage ./labs.nix {
    inherit nodeModules;
  };

  studio = pkgs.callPackage ./studio.nix {
    inherit nodeModules;
  };

  gitopsGenerateApplications = pkgs.callPackage ./gitops-generate-applications.nix { };

  gitopsTagImages = pkgs.callPackage ./gitops-tag-images.nix {
    inherit gitopsGenerateApplications;
  };
in
{
  inherit
    dotdev
    gitopsGenerateApplications
    gitopsTagImages
    labs
    nodeModules
    studio
    ;

  nodeModulesUpdater = nodeModules.override {
    npmDepsHash = pkgs.lib.fakeHash;
  };
}
// (import ./images.nix {
  inherit
    dotdev
    labs
    pkgs
    studio
    ;
})
