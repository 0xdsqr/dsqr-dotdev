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

  changeset = pkgs.callPackage ./changeset.nix {
    inherit nodeModules;
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

  gitopsRender = pkgs.callPackage ./gitops-render.nix { };

  gitopsReleaseImage = pkgs.callPackage ./gitops-release-image.nix { };

  releasePrepare = pkgs.callPackage ./release-prepare.nix {
    inherit changeset gitopsReleaseImage;
  };

  releasePublishCharts = pkgs.callPackage ./release-publish-charts.nix { };

  releasePublishImages = pkgs.callPackage ./release-publish-images.nix { };
in
{
  inherit
    changeset
    dotdev
    gitopsGenerateApplications
    gitopsRender
    gitopsReleaseImage
    labs
    nodeModules
    releasePrepare
    releasePublishCharts
    releasePublishImages
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
