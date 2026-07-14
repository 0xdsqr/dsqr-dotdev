{
  pkgs,
  packages,
  treefmtCheck,
}:
{
  format = treefmtCheck;
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
    gitopsGenerateApplications = packages.gitopsGenerateApplications;
  };
  infra-smoke = pkgs.callPackage ./infra-smoke.nix {
    nodeModules = packages.nodeModules;
  };
  runtime-smoke = pkgs.callPackage ./runtime-smoke.nix {
    inherit (packages) dotdev labs studio;
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
