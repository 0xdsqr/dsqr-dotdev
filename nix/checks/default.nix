{
  pkgs,
  packages,
  treefmtCheck,
}:
{
  format = treefmtCheck;
  dependency-policy = pkgs.callPackage ./dependency-policy.nix { };
  lint = pkgs.callPackage ./lint.nix {
    nodeModules = packages.nodeModules;
  };
  helm = pkgs.callPackage ./helm.nix { };
  image-runtime = pkgs.callPackage ./image-runtime.nix {
    images = [
      packages.dotdevImage
      packages.labsImage
      packages.studioImage
    ];
  };
  gitops = pkgs.callPackage ./gitops.nix {
    inherit (packages) gitopsGenerateApplications gitopsRender;
  };
  infra-smoke = pkgs.callPackage ./infra-smoke.nix {
    nodeModules = packages.nodeModules;
  };
  runtime-smoke = pkgs.callPackage ./runtime-smoke.nix {
    inherit (packages) dotdev labs studio;
  };
  release-versioning = pkgs.callPackage ./release-versioning.nix {
    inherit (packages) gitopsReleaseImage releaseVerifyCandidates;
  };
  typecheck = pkgs.callPackage ./typecheck.nix {
    nodeModules = packages.nodeModules;
  };
  security-boundaries = pkgs.callPackage ./security-boundaries.nix {
    nodeModules = packages.nodeModules;
  };
  typecheck-infra-native = pkgs.callPackage ./typecheck-infra-native.nix {
    nodeModules = packages.nodeModules;
  };
  workflows = pkgs.callPackage ./workflows.nix { };
  dotdev = packages.dotdev;
  labs = packages.labs;
  studio = packages.studio;
}
