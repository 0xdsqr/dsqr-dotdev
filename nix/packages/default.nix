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

  nghttp2 = pkgs.nghttp2.override { enableApp = false; };

  sqlite = pkgs.sqlite.overrideAttrs (old: {
    version = "3.53.2";

    src = pkgs.fetchurl {
      url = "https://sqlite.org/2026/sqlite-src-3530200.zip";
      hash = "sha256-yv/3ZMA/bXIJaPdG4vR6mGu/Er9MGJBPHrExwLC1ktM=";
    };

    docsrc = pkgs.fetchurl {
      url = "https://sqlite.org/2026/sqlite-doc-3530200.zip";
      hash = "sha256-MMVIiSbnKguVjWQ3fJHJdaNajxbShcu4PPrTH0r3HG0=";
    };

    postInstall = ''
      mkdir -p $doc/share/doc
      unzip $docsrc
      mv sqlite-doc-3530200 $doc/share/doc/sqlite
    '';

    meta = old.meta // {
      changelog = "https://www.sqlite.org/releaselog/3_53_2.html";
    };
  });

  rewrittenNodejsSlim = pkgs.replaceDependencies {
    drv = pkgs.nodejs-slim_24;
    replacements = [
      {
        oldDependency = pkgs.sqlite.bin;
        newDependency = sqlite.bin;
      }
      {
        oldDependency = pkgs.sqlite.dev;
        newDependency = sqlite.dev;
      }
      {
        oldDependency = pkgs.sqlite.out;
        newDependency = sqlite.out;
      }
      {
        oldDependency = pkgs.nghttp2;
        newDependency = nghttp2;
      }
      {
        oldDependency = pkgs.nghttp2.dev;
        newDependency = nghttp2.dev;
      }
      {
        oldDependency = pkgs.nghttp2.lib;
        newDependency = nghttp2.lib;
      }
    ];
  };

  nodejs-slim =
    if pkgs.stdenv.hostPlatform.isDarwin then
      rewrittenNodejsSlim.overrideAttrs (old: {
        buildCommand = old.buildCommand + ''
          source ${pkgs.darwin.signingUtils}
          sign "$out/bin/node"
        '';
      })
    else
      rewrittenNodejsSlim;

  runtime = {
    nodejs_24 = pkgs.nodejs_24;
    nodejs-slim_24 = nodejs-slim;
  };

  registriesConf = pkgs.writeText "containers-registries.conf" ''
    unqualified-search-registries = []
  '';

  changeset = pkgs.callPackage ./changeset.nix {
    inherit nodeModules;
  };

  dotdev = pkgs.callPackage ./dotdev.nix ({ inherit nodeModules; } // runtime);

  labs = pkgs.callPackage ./labs.nix ({ inherit nodeModules; } // runtime);

  studio = pkgs.callPackage ./studio.nix ({ inherit nodeModules; } // runtime);

  gitopsGenerateApplications = pkgs.callPackage ./gitops-generate-applications.nix { };

  gitopsCleanupTracking = pkgs.callPackage ./gitops-cleanup-tracking.nix { };

  gitopsRender = pkgs.callPackage ./gitops-render.nix { };

  gitopsReleaseImage = pkgs.callPackage ./gitops-release-image.nix { };

  releasePrepare = pkgs.callPackage ./release-prepare.nix {
    inherit changeset gitopsReleaseImage registriesConf;
  };

  releasePublishCharts = pkgs.callPackage ./release-publish-charts.nix { };

  releasePublishImages = pkgs.callPackage ./release-publish-images.nix {
    inherit registriesConf;
  };

  releaseVerifyCandidates = pkgs.callPackage ./release-verify-candidates.nix {
    inherit registriesConf;
  };

  securityAudit = pkgs.callPackage ./security-audit.nix { };
in
{
  inherit
    changeset
    dotdev
    gitopsCleanupTracking
    gitopsGenerateApplications
    gitopsRender
    gitopsReleaseImage
    labs
    nodeModules
    releasePrepare
    releasePublishCharts
    releasePublishImages
    releaseVerifyCandidates
    securityAudit
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
