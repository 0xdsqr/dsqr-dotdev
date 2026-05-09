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
  gitops = pkgs.callPackage ./gitops.nix { };
  infra-smoke = pkgs.callPackage ./infra-smoke.nix {
    nodeModules = packages.nodeModules;
  };
  typecheck = pkgs.callPackage ./typecheck.nix {
    nodeModules = packages.nodeModules;
  };
  typecheck-infra-native = pkgs.callPackage ./typecheck-infra-native.nix {
    nodeModules = packages.nodeModules;
  };
  dotdev = packages.dotdev;
  labs = packages.labs;
  studio = packages.studio;
}
