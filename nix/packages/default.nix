{
  perSystem =
    {
      config,
      pkgs,
      lib,
      ...
    }:
    let
      appNames = [
        "dotdev"
        "labs"
        "studio"
      ];
    in
    {
      packages =
        lib.genAttrs appNames (appName: pkgs.callPackage ./app.nix { inherit appName; })
        // {
          default = config.packages.dotdev;
        }
        // lib.optionalAttrs pkgs.stdenv.hostPlatform.isLinux (
          lib.listToAttrs (
            map (appName: {
              name = "${appName}-image";
              value = pkgs.callPackage ./image.nix {
                inherit appName;
                app = config.packages.${appName};
              };
            }) appNames
          )
        );

      apps =
        lib.genAttrs appNames (appName: {
          type = "app";
          meta.description = "Run the production ${appName} server";
          program = "${config.packages.${appName}}/bin/${appName}";
        })
        // lib.listToAttrs (
          map (appName: {
            name = "dev-${appName}";
            value = {
              type = "app";
              meta.description = "Run the ${appName} development server";
              program = lib.getExe (
                pkgs.writeShellApplication {
                  name = "${appName}-dev";
                  runtimeInputs = [ pkgs.nodejs_24 ];
                  text = ''
                    exec npm run dev --workspace ${appName} -- "$@"
                  '';
                }
              );
            };
          }) appNames
        )
        // {
          default = config.apps.dotdev;
          dev = config.apps.dev-dotdev;
        };
    };
}
