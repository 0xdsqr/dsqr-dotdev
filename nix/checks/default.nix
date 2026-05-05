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
  typecheck = pkgs.callPackage ./typecheck.nix {
    nodeModules = packages.nodeModules;
  };
  dotdev = packages.dotdev;
  labs = packages.labs;
  studio = packages.studio;
}
