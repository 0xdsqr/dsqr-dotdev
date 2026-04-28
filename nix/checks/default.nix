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
  typecheck = pkgs.callPackage ./typecheck.nix {
    nodeModules = packages.nodeModules;
  };
  dotdev = packages.dotdev;
  studio = packages.studio;
}
