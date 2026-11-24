{
  perSystem =
    {
      config,
      pkgs,
      lib,
      ...
    }:
    {
      checks =
        lib.mapAttrs
          (
            appName: port:
            pkgs.callPackage ./checks/app.nix {
              inherit appName port;
              app = config.packages.${appName};
            }
          )
          {
            dotdev = 3130;
            labs = 3131;
            studio = 3132;
          }
        // {

          helm = pkgs.callPackage ./checks/helm.nix { };

          api-tests = pkgs.callPackage ./checks/api-tests.nix {
            inherit (config.packages.dotdev) npmDeps;
          };

          lint =
            pkgs.runCommand "dsqr-dotdev-lint"
              {
                nativeBuildInputs = [ pkgs.oxlint ];
                src = lib.fileset.toSource {
                  root = ../.;
                  fileset = lib.fileset.unions [
                    ../.oxlintrc.json
                    ../apps
                    ../packages
                    ./checks
                  ];
                };
              }
              ''
                cd "$src"
                oxlint --deny-warnings apps packages nix/checks
                touch "$out"
              '';

          workflows =
            pkgs.runCommand "dsqr-dotdev-workflows"
              {
                nativeBuildInputs = [
                  pkgs.actionlint
                  pkgs.shellcheck
                  pkgs.zizmor
                ];
                src = lib.fileset.toSource {
                  root = ../.;
                  fileset = ../.github;
                };
              }
              ''
                cd "$src"
                actionlint .github/workflows/*.yml
                zizmor --offline --no-progress --min-severity medium .github
                touch "$out"
              '';

          smoke =
            pkgs.runCommand "dsqr-dotdev-toolchain-smoke"
              {
                inherit (config.devShells.default) nativeBuildInputs buildInputs;
              }
              ''
                export HOME="$TMPDIR"
                node --eval 'require("node:assert/strict").equal(process.versions.node.split(".")[0], "26")'
                node --version
                npm --version
                git --version
                nixfmt --version
                touch "$out"
              '';
        };
    };
}
