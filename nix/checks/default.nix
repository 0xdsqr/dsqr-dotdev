{
  pkgs,
  packages,
  treefmtCheck,
}:
let
  mkRuntimeSmoke =
    appName: app: port: path:
    pkgs.callPackage ./app-runtime-smoke.nix {
      inherit
        app
        appName
        path
        port
        ;
    };
  mkImageRuntime =
    image:
    pkgs.callPackage ./image-runtime.nix {
      images = [ image ];
    };
in
{
  format = treefmtCheck;
  ci-plan = pkgs.callPackage ./ci-plan.nix { };
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
  runtime-smoke-dotdev = mkRuntimeSmoke "dotdev" packages.dotdev 3020 "/about";
  runtime-smoke-studio = mkRuntimeSmoke "studio" packages.studio 3021 "/";
  runtime-smoke-labs = mkRuntimeSmoke "labs" packages.labs 3022 "/";
  image-runtime-dotdev = mkImageRuntime packages.dotdevImage;
  image-runtime-studio = mkImageRuntime packages.studioImage;
  image-runtime-labs = mkImageRuntime packages.labsImage;
  dotdev = packages.dotdev;
  labs = packages.labs;
  studio = packages.studio;
}
